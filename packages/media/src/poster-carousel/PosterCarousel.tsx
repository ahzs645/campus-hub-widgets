'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps } from '@firstform/campus-hub-widget-sdk';
import {
  fetchJsonWithCache,
  fetchTextWithCache,
  buildCacheKey,
  buildProxyUrl,
  normalizeSourcePayload,
  resolveSourceAdapter,
} from '@firstform/campus-hub-widget-sdk';
import { SourceUnavailable } from '@firstform/campus-hub-widgets-shared';

export interface Poster {
  id: string | number;
  title: string;
  subtitle?: string;
  image: string;
  fallbackImage?: string;
}

type DataSource = 'default' | 'api' | 'source' | 'unbc-news';
type SourceImageQuality = 'original' | 'thumbnail';

interface PosterCarouselConfig {
  rotationSeconds?: number;
  apiUrl?: string;
  posters?: Poster[];
  dataSource?: DataSource;
  sourceAdapter?: string;
  sourceLabel?: string;
  maxStories?: number;
  refreshInterval?: number;
  useCorsProxy?: boolean;
  imageQuality?: SourceImageQuality;
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

export default function PosterCarousel({ config, theme }: WidgetComponentProps) {
  const carouselConfig = config as PosterCarouselConfig | undefined;
  const rotationSeconds = carouselConfig?.rotationSeconds ?? 10;
  const configuredDataSource = carouselConfig?.dataSource ?? 'default';
  // Backward compatibility for templates saved before source adapters existed.
  const dataSource = configuredDataSource === 'unbc-news' ? 'source' : configuredDataSource;
  const apiUrl = carouselConfig?.apiUrl;
  const sourceAdapterId = carouselConfig?.sourceAdapter
    ?? (configuredDataSource === 'unbc-news' ? 'unbc-news-releases' : undefined);
  const sourceAdapter = resolveSourceAdapter({ adapterId: sourceAdapterId, url: apiUrl });
  const sourceUrl = apiUrl || sourceAdapter?.defaultUrl;
  const sourceLabel = carouselConfig?.sourceLabel || sourceAdapter?.label;
  const maxStories = carouselConfig?.maxStories ?? 5;
  const refreshInterval = carouselConfig?.refreshInterval ?? 30; // minutes
  const useCorsProxy = carouselConfig?.useCorsProxy ?? true;
  const imageQuality = carouselConfig?.imageQuality ?? 'original';
  const showText = carouselConfig?.showText ?? true;
  const showProgressBar = carouselConfig?.showProgressBar ?? true;
  const showSequenceIndicator = carouselConfig?.showSequenceIndicator ?? true;

  const manualPosters = carouselConfig?.posters;
  // 'default' with no manually configured posters is the unconfigured demo state.
  const isDemo = dataSource === 'default' && !(manualPosters && manualPosters.length > 0);
  // Identifies the configured remote source a poster list belongs to, so a
  // config change never shows another source's posters while refetching.
  const sourceKey = dataSource === 'api'
    ? `api:${apiUrl ?? ''}`
    : dataSource === 'source'
      ? `source:${sourceAdapter?.id ?? ''}:${sourceUrl ?? ''}`
      : null;

  // Last-good posters from the configured remote source. A configured source
  // starts empty (loading), never with the sample posters.
  const [live, setLive] = useState<{ key: string; posters: Poster[] } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restart the rotation (and drop a previous source's error) when the
  // configured source changes.
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsTransitioning(false);
    setError(null);
  }, [dataSource, manualPosters, sourceKey]);

  // Fetch posters from a JSON API through the shared proxy/cache helper.
  useEffect(() => {
    if (dataSource !== 'api') return;
    if (!apiUrl) {
      setError('No API URL configured');
      return;
    }
    const key = `api:${apiUrl}`;

    const fetchPosters = async () => {
      try {
        const fetchUrl = useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl;
        // fetchJsonWithCache rejects non-2xx responses before parsing JSON.
        const { data } = await fetchJsonWithCache<unknown>(fetchUrl, {
          cacheKey: buildCacheKey('poster-carousel', apiUrl),
          ttlMs: refreshInterval * 60 * 1000,
          allowStale: true,
        });
        const nextPosters = normalizePosters(data);
        if (nextPosters.length > 0) {
          setLive({ key, posters: nextPosters });
          setCurrentIndex(0);
          setProgress(0);
          setError(null);
        } else {
          // Keep last-good posters; never fall back to the sample posters.
          setError('No posters found in API response');
        }
      } catch (err) {
        console.error('Failed to fetch posters:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posters from API');
      }
    };

    fetchPosters();
    const interval = setInterval(fetchPosters, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataSource, apiUrl, refreshInterval, useCorsProxy]);

  // Fetch provider-specific sources through the shared source adapter layer.
  useEffect(() => {
    if (dataSource !== 'source') return;
    if (!sourceAdapter || !sourceUrl) {
      setError('No matching source adapter for the configured URL');
      return;
    }
    const key = `source:${sourceAdapter.id}:${sourceUrl}`;

    const fetchSource = async () => {
      try {
        const proxiedUrl = useCorsProxy ? buildProxyUrl(sourceUrl) : sourceUrl;
        const { text } = await fetchTextWithCache(proxiedUrl, {
          cacheKey: buildCacheKey(`source-adapter:${sourceAdapter.id}`, sourceUrl),
          ttlMs: refreshInterval * 60 * 1000,
          allowStale: true,
        });
        const normalized = normalizeSourcePayload({
          adapterId: sourceAdapter.id,
          url: sourceUrl,
          rawText: text,
          options: { maxItems: maxStories, imageQuality },
        });
        const nextPosters = normalizePosters(normalized?.items ?? []);
        if (nextPosters.length > 0) {
          setLive({ key, posters: nextPosters });
          setCurrentIndex(0);
          setProgress(0);
          setError(null);
        } else {
          // Keep last-good posters; never fall back to the sample posters.
          setError('No poster items found in source');
        }
      } catch (err) {
        console.error('Failed to fetch adapted source:', err);
        setError(err instanceof Error ? err.message : 'Failed to load source');
      }
    };

    fetchSource();
    const interval = setInterval(fetchSource, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataSource, sourceAdapter, sourceUrl, maxStories, refreshInterval, useCorsProxy, imageQuality]);

  // demo → sample posters (badged); manual → operator-configured posters;
  // live → last-good posters from the configured source; unavailable → the
  // configured source failed with nothing good to show.
  const posters: Poster[] = dataSource === 'default'
    ? (manualPosters && manualPosters.length > 0 ? manualPosters : DEFAULT_POSTERS)
    : live?.key === sourceKey ? live.posters : [];
  const isUnavailable = dataSource !== 'default' && posters.length === 0 && error !== null;

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

  const safeIndex = posters.length > 0 ? currentIndex % posters.length : 0;
  const current = posters[safeIndex];

  if (!current) {
    return (
      <div
        className="h-full rounded-2xl flex items-center justify-center flex-col gap-2"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        {isUnavailable ? (
          <SourceUnavailable label="Posters" detail={error} />
        ) : (
          <span className="text-white/50">
            {dataSource === 'default' ? 'No posters available' : 'Loading posters…'}
          </span>
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
                backgroundColor: idx === safeIndex ? theme.accent : 'rgba(255,255,255,0.4)',
                transform: idx === safeIndex ? 'scale(1.2)' : 'scale(1)',
                boxShadow: idx === safeIndex ? `0 0 20px ${theme.accent}` : 'none',
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

      {/* Optional provider label supplied by the linked source. */}
      {dataSource === 'source' && sourceLabel && (
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white/90 backdrop-blur-sm"
          style={{ backgroundColor: `${theme.primary}99` }}
        >
          {sourceLabel}
        </div>
      )}

      {/* Sample posters shown only while no source is configured. */}
      {isDemo && (
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white/70 backdrop-blur-sm"
          style={{ backgroundColor: `${theme.primary}99` }}
        >
          Demo
        </div>
      )}

      {/* Refresh failed but last-good posters are still shown. */}
      {dataSource !== 'default' && error && (
        <div
          className="absolute top-3 right-3 max-w-[60%] truncate px-3 py-1 rounded-full text-xs font-medium text-red-200 backdrop-blur-sm"
          style={{ backgroundColor: `${theme.primary}99` }}
          title={error}
        >
          Update failed – showing last loaded posters
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
        : typeof record.imageUrl === 'string'
          ? record.imageUrl
        : typeof record.url === 'string'
          ? record.url
          : '';
      if (!image) return null;

      return {
        id: typeof record.id === 'string' || typeof record.id === 'number' ? record.id : index,
        title: typeof record.title === 'string' && record.title.trim() ? record.title : `Poster ${index + 1}`,
        subtitle: typeof record.subtitle === 'string'
          ? record.subtitle
          : typeof record.date === 'string'
            ? record.date
            : undefined,
        image,
        fallbackImage: typeof record.fallbackImage === 'string'
          ? record.fallbackImage
          : typeof record.fallbackImageUrl === 'string'
            ? record.fallbackImageUrl
            : undefined,
      };
    })
    .filter((poster): poster is Poster => poster !== null);
}
