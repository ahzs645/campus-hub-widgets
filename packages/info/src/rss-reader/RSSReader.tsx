'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchTextWithCache } from '@firstform/campus-hub-widget-sdk';
import { useFitScale } from '@firstform/campus-hub-widget-sdk';
import { AppIcon, FadeOverlay } from '@firstform/campus-hub-widget-sdk';
import RSSReaderOptions from './RSSReaderOptions';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface RSSConfig {
  feedUrl?: string;
  maxItems?: number;
  refreshInterval?: number;
  showDescription?: boolean;
  showDate?: boolean;
  scrollSpeed?: number;
  title?: string;
  useCorsProxy?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DEMO_ITEMS: FeedItem[] = [
  { title: 'Campus Library Extends Hours for Finals Week', link: '#', description: 'The main library will remain open 24/7 during the upcoming finals period to support student study needs.', pubDate: new Date(Date.now() - 3600000).toISOString() },
  { title: 'Spring Career Fair — March 28', link: '#', description: 'Over 50 employers will be on campus. Bring your resume and dress professionally.', pubDate: new Date(Date.now() - 7200000).toISOString() },
  { title: 'New Shuttle Route Added to North Campus', link: '#', description: 'A new express route connects the north residence halls directly to the science complex.', pubDate: new Date(Date.now() - 14400000).toISOString() },
  { title: 'Student Government Election Results', link: '#', description: 'Congratulations to the newly elected student body president and council members.', pubDate: new Date(Date.now() - 28800000).toISOString() },
  { title: 'Campus Sustainability Initiative Launches', link: '#', description: 'New recycling stations and composting bins installed across all dining facilities.', pubDate: new Date(Date.now() - 43200000).toISOString() },
];

function parseRSSXml(xml: string): { title: string; items: FeedItem[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Try RSS 2.0 first
  const channel = doc.querySelector('channel');
  if (channel) {
    const feedTitle = channel.querySelector(':scope > title')?.textContent ?? 'RSS Feed';
    const items = Array.from(channel.querySelectorAll('item')).map((item) => ({
      title: item.querySelector('title')?.textContent ?? '',
      link: item.querySelector('link')?.textContent ?? '',
      description: (item.querySelector('description')?.textContent ?? '').replace(/<[^>]*>/g, '').trim(),
      pubDate: item.querySelector('pubDate')?.textContent ?? '',
    }));
    return { title: feedTitle, items };
  }

  // Try Atom
  const feed = doc.querySelector('feed');
  if (feed) {
    const feedTitle = feed.querySelector(':scope > title')?.textContent ?? 'Feed';
    const items = Array.from(feed.querySelectorAll('entry')).map((entry) => ({
      title: entry.querySelector('title')?.textContent ?? '',
      link: entry.querySelector('link')?.getAttribute('href') ?? '',
      description: (entry.querySelector('summary, content')?.textContent ?? '').replace(/<[^>]*>/g, '').trim(),
      pubDate: entry.querySelector('published, updated')?.textContent ?? '',
    }));
    return { title: feedTitle, items };
  }

  return { title: 'Feed', items: [] };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RSSReader({ config, theme }: WidgetComponentProps) {
  const rssConfig = config as RSSConfig | undefined;
  const feedUrl = rssConfig?.feedUrl?.trim() || '';
  const maxItems = rssConfig?.maxItems ?? 10;
  const refreshInterval = rssConfig?.refreshInterval ?? 15;
  const showDescription = rssConfig?.showDescription ?? true;
  const showDate = rssConfig?.showDate ?? true;
  const scrollSpeed = rssConfig?.scrollSpeed ?? 40;
  const customTitle = rssConfig?.title?.trim() || '';
  const useCorsProxy = rssConfig?.useCorsProxy ?? true;
  const [items, setItems] = useState<FeedItem[]>(DEMO_ITEMS);
  const [feedTitle, setFeedTitle] = useState(customTitle || 'Campus News');
  const [error, setError] = useState<string | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ viewportHeight: 0, contentHeight: 0 });

  const { containerRef, containerWidth, containerHeight } = useFitScale(480, 600);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    if (!feedUrl) {
      setItems(DEMO_ITEMS);
      setFeedTitle(customTitle || 'Campus News');
      return;
    }
    try {
      setError(null);
      const url = useCorsProxy ? buildProxyUrl(feedUrl) : feedUrl;
      const { text } = await fetchTextWithCache(url, {
        cacheKey: buildCacheKey('rss', feedUrl),
        ttlMs: refreshInterval * 60 * 1000,
      });
      const parsed = parseRSSXml(text);
      if (parsed.items.length === 0) {
        setError('No items found in feed');
        return;
      }
      setItems(parsed.items.slice(0, maxItems));
      setFeedTitle(customTitle || parsed.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    }
  }, [feedUrl, refreshInterval, maxItems, customTitle, useCorsProxy]);

  useEffect(() => {
    fetchFeed();
    if (feedUrl) {
      const interval = setInterval(fetchFeed, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchFeed, feedUrl, refreshInterval]);

  useEffect(() => {
    const measure = () => {
      const viewportHeight = viewportRef.current?.clientHeight ?? 0;
      const contentHeight = contentRef.current?.scrollHeight ?? 0;
      setScrollMetrics((prev) => (
        prev.viewportHeight === viewportHeight && prev.contentHeight === contentHeight
          ? prev
          : { viewportHeight, contentHeight }
      ));
    };

    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items, showDescription, showDate, feedTitle, containerWidth, containerHeight, error]);

  const resolvedWidth = containerWidth || 400;
  const resolvedHeight = containerHeight || 400;
  const padX = clamp(resolvedWidth * 0.045, 12, 22);
  const padY = clamp(resolvedHeight * 0.035, 10, 18);
  const headerGap = clamp(resolvedWidth * 0.02, 8, 14);
  const iconSize = clamp(Math.min(resolvedWidth, resolvedHeight) * 0.055, 16, 22);
  const titleSize = clamp(Math.min(resolvedWidth * 0.06, resolvedHeight * 0.065), 16, 24);
  const badgeSize = clamp(Math.min(resolvedWidth * 0.028, resolvedHeight * 0.03), 10, 12);
  const itemPadY = clamp(resolvedHeight * 0.028, 10, 16);
  const itemGap = clamp(resolvedWidth * 0.025, 8, 12);
  const dotSize = clamp(Math.min(resolvedWidth, resolvedHeight) * 0.0055, 4, 7);
  const headlineSize = clamp(Math.min(resolvedWidth * 0.045, resolvedHeight * 0.05), 14, 19);
  const descriptionSize = clamp(Math.min(resolvedWidth * 0.036, resolvedHeight * 0.038), 11, 15);
  const metaSize = clamp(Math.min(resolvedWidth * 0.028, resolvedHeight * 0.032), 10, 12);
  const shouldLoop =
    scrollSpeed > 0
    && items.length > 1
    && scrollMetrics.contentHeight > scrollMetrics.viewportHeight + 4;
  const duration = shouldLoop
    ? clamp(
      (scrollMetrics.contentHeight / Math.max(descriptionSize * 1.8, 1)) * (scrollSpeed / 10),
      8,
      180,
    )
    : 0;

  const renderItems = (keyPrefix: string, ariaHidden = false) => (
    <div ref={ariaHidden ? undefined : contentRef} aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <div
          key={`${keyPrefix}-${item.title}-${i}`}
          style={{
            padding: `${itemPadY}px ${padX}px`,
            borderBottom: `1px solid ${theme.accent}10`,
          }}
        >
          <div className="flex items-start" style={{ gap: itemGap }}>
            <div
              className="rounded-full shrink-0"
              style={{
                width: dotSize,
                height: dotSize,
                marginTop: Math.max(4, headlineSize * 0.45),
                backgroundColor: theme.accent,
              }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="font-medium leading-snug"
                style={{ fontSize: headlineSize, color: 'white' }}
              >
                {item.title}
              </div>
              {showDescription && item.description && (
                <div
                  className="mt-1 line-clamp-2 leading-relaxed"
                  style={{ fontSize: descriptionSize, color: 'rgba(255,255,255,0.58)' }}
                >
                  {item.description}
                </div>
              )}
              {showDate && item.pubDate && (
                <div className="mt-1" style={{ fontSize: metaSize, color: `${theme.accent}90` }}>
                  {timeAgo(item.pubDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{
        backgroundColor: theme.background,
        backgroundImage: 'linear-gradient(var(--widget-theme-tint, transparent), var(--widget-theme-tint, transparent))',
      }}
    >
      <style>{`
        @keyframes rssTickerLoop {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(-1 * var(--rss-loop-distance, 0px))); }
        }
      `}</style>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="flex items-center shrink-0"
          style={{
            gap: headerGap,
            padding: `${padY}px ${padX}px`,
            borderBottom: `1px solid ${theme.accent}20`,
          }}
        >
          <span style={{ color: theme.accent }}><AppIcon name="rss" style={{ width: iconSize, height: iconSize }} /></span>
          <span className="font-semibold text-white truncate" style={{ fontSize: titleSize }}>{feedTitle}</span>
          {!feedUrl && (
            <span
              className="rounded-full ml-auto"
              style={{
                padding: '2px 8px',
                fontSize: badgeSize,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Demo
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="shrink-0" style={{ padding: `${itemPadY}px ${padX}px`, fontSize: descriptionSize, color: theme.accent }}>
            {error}
          </div>
        )}

        {/* Items */}
        <div ref={viewportRef} className="flex-1 overflow-hidden relative">
          <div
            className={shouldLoop ? 'will-change-transform' : ''}
            style={shouldLoop ? {
              animation: `rssTickerLoop ${duration}s linear infinite`,
              ['--rss-loop-distance' as string]: `${scrollMetrics.contentHeight}px`,
            } : undefined}
          >
            {renderItems('primary')}
            {shouldLoop && renderItems('loop', true)}
          </div>

          {/* Fade edges */}
          {shouldLoop && <FadeOverlay theme={theme} />}
        </div>
      </div>
    </div>
  );
}

registerWidget({
  type: 'rss-reader',
  name: 'RSS Reader',
  description: 'Display RSS or Atom feed content',
  icon: 'rss',
  minW: 2,
  minH: 2,
  defaultW: 4,
  defaultH: 4,
  component: RSSReader,
  OptionsComponent: RSSReaderOptions,
  acceptsSources: [{ propName: 'feedUrl', types: ['feed'] }],
  defaultProps: {
    feedUrl: '',
    maxItems: 10,
    refreshInterval: 15,
    showDescription: true,
    showDate: true,
    scrollSpeed: 40,
    title: '',
    useCorsProxy: true,
  },
});
