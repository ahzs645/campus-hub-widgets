'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { fetchTextWithCache, buildCacheKey, buildProxyUrl } from '@firstform/campus-hub-widget-sdk';
import PosterCarouselOptions from './PosterCarouselOptions';

interface Poster {
  id: string | number;
  title: string;
  subtitle?: string;
  image: string;
  fallbackImage?: string;
}

type DataSource = 'default' | 'api' | 'unbc-news';
type UNBCImageQuality = 'original' | 'thumbnail';

interface PosterCarouselConfig {
  rotationSeconds?: number;
  apiUrl?: string;
  posters?: Poster[];
  dataSource?: DataSource;
  maxStories?: number;
  refreshInterval?: number;
  useCorsProxy?: boolean;
  imageQuality?: UNBCImageQuality;
  showText?: boolean;
  showProgressBar?: boolean;
  showSequenceIndicator?: boolean;
}

const DEFAULT_POSTERS: Poster[] = [
  {
    id: 1,
    title: 'Spring Festival 2025',
    subtitle: 'March 15-17 | Main Quad',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
  },
  {
    id: 2,
    title: 'Career Fair',
    subtitle: 'Meet 50+ employers | March 20',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
  },
  {
    id: 3,
    title: 'Basketball Championship',
    subtitle: 'Finals this Saturday | 7PM',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
  },
  {
    id: 4,
    title: 'Art Exhibition Opening',
    subtitle: 'Student Gallery | Free Entry',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop',
  },
];

const UNBC_NEWS_URL = 'https://www.unbc.ca/our-stories/releases';

/** True when a source URL points at the UNBC releases page scraped by the runtime. */
function isUnbcNewsUrl(url: string): boolean {
  return /unbc\.ca\/our-stories\/releases/i.test(url);
}

function resolveUNBCImageUrl(imageSrc: string) {
  return new URL(imageSrc, 'https://www.unbc.ca').toString();
}

function getOriginalUNBCImageUrl(imageSrc: string) {
  const url = new URL(imageSrc, 'https://www.unbc.ca');

  url.pathname = url.pathname
    .replace(/\/sites\/default\/files\/styles\/[^/]+\/public\//, '/sites/default/files/')
    .replace(/\.(jpe?g|png|gif)\.webp$/i, '.$1');
  url.search = '';

  return url.toString();
}

function decodeHtmlEntities(value: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return doc.body.textContent ?? '';
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function buildUNBCPoster(
  storyPath: string,
  imageSrc: string,
  title: string,
  subtitle: string | undefined,
  imageQuality: UNBCImageQuality,
): Poster {
  const thumbnailUrl = resolveUNBCImageUrl(imageSrc);
  const imageUrl = imageQuality === 'original'
    ? getOriginalUNBCImageUrl(imageSrc)
    : thumbnailUrl;

  return {
    id: storyPath,
    title,
    subtitle,
    image: imageUrl,
    fallbackImage: imageUrl !== thumbnailUrl ? thumbnailUrl : undefined,
  };
}

/** Parse the UNBC news releases page HTML into poster items */
export const parseUNBCNewsPage = (
  html: string,
  maxStories: number,
  imageQuality: UNBCImageQuality
): Poster[] => {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const titleLinks = doc.querySelectorAll<HTMLAnchorElement>(
      'h1 a[href*="/our-stories/story/"], h2 a[href*="/our-stories/story/"], h3 a[href*="/our-stories/story/"], h4 a[href*="/our-stories/story/"]',
    );
    const posters: Poster[] = [];
    const seenStoryPaths = new Set<string>();

    for (const titleLink of titleLinks) {
      if (posters.length >= maxStories) break;

      const storyPath = titleLink.getAttribute('href')?.trim() ?? '';
      const title = titleLink.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (!storyPath || !title || seenStoryPaths.has(storyPath)) continue;

      // The current Drupal markup puts the image and `.article-item--col2`
      // text in sibling columns. Walk up until both are in the same scope.
      let scope: Element | null = titleLink.closest('.article-item, article, .views-row, li')
        ?? titleLink.parentElement;
      let image = scope?.querySelector<HTMLImageElement>('img') ?? null;
      for (let depth = 0; !image && scope?.parentElement && scope !== doc.body && depth < 4; depth += 1) {
        scope = scope.parentElement;
        image = scope.querySelector<HTMLImageElement>('img');
      }

      const imageSrc = image?.getAttribute('src')
        ?? image?.getAttribute('data-src')
        ?? image?.getAttribute('data-lazy-src')
        ?? '';
      if (!imageSrc) continue;

      const subtitle = scope?.querySelector('time')?.textContent?.replace(/\s+/g, ' ').trim() || undefined;
      posters.push(buildUNBCPoster(storyPath, imageSrc, title, subtitle, imageQuality));
      seenStoryPaths.add(storyPath);
    }

    if (posters.length > 0) return posters;
  }

  const posters: Poster[] = [];

  // Non-DOM fallback for pre-rendering and tests in non-browser runtimes.
  const storyPattern = /<a\s+href="(\/our-stories\/story\/[^"]+)"[^>]*>\s*<img\s+[^>]*src="([^"]+)"[^>]*\/?\s*>\s*<\/a>[\s\S]*?<h[1-4][^>]*>\s*<a\s+href="\/our-stories\/story\/[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>\s*<\/h[1-4]>/gi;

  let match: RegExpExecArray | null;
  while ((match = storyPattern.exec(html)) !== null && posters.length < maxStories) {
    const storyPath = match[1];
    const imageSrc = match[2];
    const title = decodeHtmlEntities(match[3]).replace(/\s+/g, ' ').trim();

    if (!title || !imageSrc) continue;

    // Try to extract date text immediately after the heading.
    const afterHeading = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
    const dateMatch = afterHeading.match(/([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/);
    const subtitle = dateMatch ? dateMatch[1] : undefined;

    posters.push(buildUNBCPoster(storyPath, imageSrc, title, subtitle, imageQuality));
  }

  return posters;
};

export default function PosterCarousel({ config, theme }: WidgetComponentProps) {
  const carouselConfig = config as PosterCarouselConfig | undefined;
  const rotationSeconds = carouselConfig?.rotationSeconds ?? 10;
  const dataSource = carouselConfig?.dataSource ?? 'default';
  const apiUrl = carouselConfig?.apiUrl;
  const maxStories = carouselConfig?.maxStories ?? 5;
  const refreshInterval = carouselConfig?.refreshInterval ?? 30; // minutes
  const useCorsProxy = carouselConfig?.useCorsProxy ?? true;
  const imageQuality = carouselConfig?.imageQuality ?? 'original';
  const showText = carouselConfig?.showText ?? true;
  const showProgressBar = carouselConfig?.showProgressBar ?? true;
  const showSequenceIndicator = carouselConfig?.showSequenceIndicator ?? true;

  const [posters, setPosters] = useState<Poster[]>(carouselConfig?.posters ?? DEFAULT_POSTERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to defaults when using default source
  useEffect(() => {
    if (dataSource !== 'default') return;
    setPosters(carouselConfig?.posters ?? DEFAULT_POSTERS);
    setCurrentIndex(0);
    setProgress(0);
    setIsTransitioning(false);
    setError(null);
  }, [dataSource, carouselConfig?.posters]);

  // Fetch posters from JSON API
  useEffect(() => {
    if (dataSource !== 'api' || !apiUrl) return;

    const fetchPosters = async () => {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const normalizedPosters = normalizePosters(data);
        if (normalizedPosters.length > 0) {
          setPosters(normalizedPosters);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch posters:', err);
        setError('Failed to load posters from API');
      }
    };

    fetchPosters();
    const interval = setInterval(fetchPosters, 60000);
    return () => clearInterval(interval);
  }, [dataSource, apiUrl]);

  // Fetch UNBC news stories
  useEffect(() => {
    if (dataSource !== 'unbc-news') return;

    const fetchNews = async () => {
      try {
        const proxiedUrl = useCorsProxy ? buildProxyUrl(UNBC_NEWS_URL) : UNBC_NEWS_URL;
        const { text } = await fetchTextWithCache(proxiedUrl, {
          cacheKey: buildCacheKey('unbc-news', UNBC_NEWS_URL),
          ttlMs: refreshInterval * 60 * 1000,
          allowStale: true,
        });
        const stories = parseUNBCNewsPage(text, maxStories, imageQuality);
        if (stories.length > 0) {
          setPosters(stories);
          setCurrentIndex(0);
          setProgress(0);
          setError(null);
        } else {
          setError('No stories found on UNBC page');
        }
      } catch (err) {
        console.error('Failed to fetch UNBC news:', err);
        setError('Failed to load UNBC news');
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataSource, maxStories, refreshInterval, useCorsProxy, imageQuality]);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % posters.length);
      setProgress(0);
      setIsTransitioning(false);
    }, 500);
  }, [posters.length]);

  useEffect(() => {
    if (posters.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 100 / (rotationSeconds * 10);
      });
    }, 100);

    const rotationInterval = setInterval(nextSlide, rotationSeconds * 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(rotationInterval);
    };
  }, [posters.length, rotationSeconds, nextSlide]);

  const current = posters[currentIndex];

  if (!current) {
    return (
      <div
        className="h-full rounded-2xl flex items-center justify-center flex-col gap-2"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <span className="text-white/50">{error ?? 'No posters available'}</span>
        {dataSource === 'unbc-news' && error && (
          <span className="text-white/30 text-sm">Check CORS proxy settings</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl group">
      {/* Background image with Ken Burns effect */}
      <div
        data-layout-diagnostic-ignore="true"
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover animate-ken-burns"
          onError={(event) => {
            if (!current.fallbackImage || event.currentTarget.src === current.fallbackImage) return;
            event.currentTarget.src = current.fallbackImage;
          }}
          style={{
            animationDuration: `${rotationSeconds}s`,
          }}
        />
      </div>

      {/* Gradient overlays for text readability */}
      {showText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </>
      )}

      {/* Content */}
      {showText && (
        <div className="absolute bottom-0 left-0 right-0 p-8 xl:p-12">
          <h2
            className="text-4xl xl:text-6xl font-display font-bold text-white mb-3 leading-tight"
            style={{
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}
          >
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="text-xl xl:text-2xl text-white/90 font-medium">
              {current.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Progress dots */}
      {showSequenceIndicator && posters.length > 1 && (
        <div className="absolute bottom-6 right-6 flex gap-2">
          {posters.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className="w-3 h-3 rounded-full transition-all duration-300 hover:scale-125"
              style={{
                backgroundColor: idx === currentIndex ? theme.accent : 'rgba(255,255,255,0.4)',
                transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)',
                boxShadow: idx === currentIndex ? `0 0 20px ${theme.accent}` : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {showProgressBar && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: theme.accent,
              boxShadow: `0 0 10px ${theme.accent}`,
            }}
          />
        </div>
      )}

      {/* Decorative corner accent */}
      <div
        className="absolute top-0 left-0 w-24 h-24 opacity-50"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}40 0%, transparent 50%)`,
        }}
      />

      {/* UNBC News badge */}
      {dataSource === 'unbc-news' && (
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white/90 backdrop-blur-sm"
          style={{ backgroundColor: `${theme.primary}99` }}
        >
          UNBC News
        </div>
      )}
    </div>
  );
}

function normalizePosters(data: unknown): Poster[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item, index): Poster | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const image = typeof record.image === 'string'
        ? record.image
        : typeof record.url === 'string'
          ? record.url
          : '';
      if (!image) return null;

      return {
        id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : index,
        title: typeof record.title === 'string' && record.title.trim() ? record.title : `Poster ${index + 1}`,
        subtitle: typeof record.subtitle === 'string' ? record.subtitle : undefined,
        image,
        fallbackImage: typeof record.fallbackImage === 'string' ? record.fallbackImage : undefined,
      };
    })
    .filter((poster): poster is Poster => poster !== null);
}

// Register the widget
registerWidget({
  type: 'poster-carousel',
  name: 'Poster Carousel',
  description: 'Rotating display of event posters and announcements',
  icon: 'carousel',
  minW: 4,
  minH: 3,
  defaultW: 8,
  defaultH: 5,
  component: PosterCarousel,
  OptionsComponent: PosterCarouselOptions,
  acceptsSources: [{
    propName: 'apiUrl',
    types: ['api', 'feed'],
    requires: { hasImages: true },
    capabilityHint: 'Sources with images look best in the carousel; text-only feeds show over a fallback background.',
    unlinkLabel: 'Use manual posters',
    removeSource: () => ({ dataSource: 'default' }),
    applySource: (source) => {
      // The UNBC releases page is HTML that a dedicated runtime path scrapes,
      // so route it to the scraper mode rather than the JSON-API mode.
      if (isUnbcNewsUrl(source.url) || source.capabilities?.format === 'html') {
        return { dataSource: 'unbc-news' };
      }
      return {
        apiUrl: source.url,
        dataSource: 'api',
      };
    },
  }, {
    propName: 'posters',
    types: ['image', 'unsplash'],
    multiple: true,
    applySource: (source, currentData) => {
      const existingPosters = Array.isArray(currentData.posters)
        ? currentData.posters as Poster[]
        : [];
      return {
        dataSource: 'default',
        posters: [
          ...existingPosters,
          {
            id: source._id,
            title: source.name,
            subtitle: source.description,
            image: source.url,
          },
        ],
      };
    },
  }],
  defaultProps: {
    rotationSeconds: 10,
    useCorsProxy: true,
    showText: true,
    showProgressBar: true,
    showSequenceIndicator: true,
  },
});
