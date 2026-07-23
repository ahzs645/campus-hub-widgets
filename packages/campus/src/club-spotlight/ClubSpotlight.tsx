'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import QRCodeLib from 'qrcode';
import {
  WidgetComponentProps,
  registerWidget,
  normalizeSourcePayload,
  resolveSourceAdapter,
  type ClubItem,
} from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchJsonWithCache, fetchTextWithCache } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale, ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import ClubSpotlightOptions from './ClubSpotlightOptions';

interface ClubSpotlightConfig {
  pageUrl?: string;
  apiUrl?: string;
  sourceAdapter?: string;
  rotationSeconds?: number;
  useCorsProxy?: boolean;
  refreshMinutes?: number;
  showQrCode?: boolean;
  qrLabel?: string;
}

const DEFAULT_CLUBS: ClubItem[] = [
  { id: '1', name: 'Outdoors Club', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=300&fit=crop', link: '' },
  { id: '2', name: 'Debate Society', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&h=300&fit=crop', link: '' },
  { id: '3', name: 'Photography Club', image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=300&h=300&fit=crop', link: '' },
];

export default function ClubSpotlight({ config, theme }: WidgetComponentProps) {
  const cfg = config as ClubSpotlightConfig | undefined;
  const apiUrl = cfg?.apiUrl?.trim() || '';
  const pageUrl = cfg?.pageUrl?.trim() || '';
  const sourceAdapterId = cfg?.sourceAdapter ?? 'unbc-clubs';
  const rotationSeconds = Math.max(4, Math.min(120, cfg?.rotationSeconds ?? 10));
  const useCorsProxy = cfg?.useCorsProxy ?? false;
  const refreshMinutes = Math.max(5, Math.min(1440, cfg?.refreshMinutes ?? 30));
  const showQrCode = cfg?.showQrCode ?? false;
  const qrLabel = cfg?.qrLabel ?? 'Learn more';

  const [clubs, setClubs] = useState<ClubItem[]>(DEFAULT_CLUBS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [usingDefaults, setUsingDefaults] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchClubs = useCallback(async () => {
    setError(null);
    const ttlMs = refreshMinutes * 60 * 1000;
    if (!apiUrl && !pageUrl) {
      setClubs(DEFAULT_CLUBS);
      setUsingDefaults(true);
      return;
    }

    // Strategy 1: Try the WordPress REST API (returns structured JSON with images)
    try {
      if (!apiUrl) throw new Error('Missing API URL');
      const apiFetchUrl = useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl;
      const { data: posts } = await fetchJsonWithCache<unknown>(apiFetchUrl, {
        cacheKey: buildCacheKey('club-spotlight-api', apiUrl),
        ttlMs,
        allowStale: true,
      });
      const normalized = normalizeSourcePayload({
        adapterId: sourceAdapterId,
        url: apiUrl,
        payload: posts,
      });
      const parsed = (normalized?.data ?? []) as ClubItem[];
      if (parsed.length > 0) {
        setClubs(parsed);
        setActiveIndex(0);
        setUsingDefaults(false);
        return;
      }
    } catch {
      // API failed — fall through to HTML scraping
    }

    // Strategy 2: Scrape the HTML page directly
    try {
      if (!pageUrl) throw new Error('Missing page URL');
      const pageFetchUrl = useCorsProxy ? buildProxyUrl(pageUrl) : pageUrl;
      const { text } = await fetchTextWithCache(pageFetchUrl, {
        cacheKey: buildCacheKey('club-spotlight-page', pageUrl),
        ttlMs,
        allowStale: true,
      });
      const normalized = normalizeSourcePayload({
        adapterId: sourceAdapterId,
        url: pageUrl,
        rawText: text,
      });
      const parsed = (normalized?.data ?? []) as ClubItem[];
      if (parsed.length > 0) {
        setClubs(parsed);
        setActiveIndex(0);
        setUsingDefaults(false);
        return;
      }
    } catch {
      // HTML scrape also failed
    }

    setError('Could not load clubs from API or page');
  }, [useCorsProxy, apiUrl, pageUrl, refreshMinutes, sourceAdapterId]);

  useEffect(() => {
    fetchClubs();
    const interval = setInterval(fetchClubs, refreshMinutes * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchClubs, refreshMinutes]);

  // Auto-rotation
  useEffect(() => {
    if (clubs.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % clubs.length);
    }, rotationSeconds * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clubs.length, rotationSeconds]);

  // QR code for current club page
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const current = clubs[activeIndex % clubs.length];
  const currentLink = current?.link || '';

  useEffect(() => {
    if (!showQrCode || !currentLink) {
      setQrDataUrl(null);
      return;
    }
    QRCodeLib.toDataURL(currentLink, {
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
      margin: 1,
      width: 256,
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [showQrCode, currentLink]);

  // Portrait: taller with larger image; landscape: side-by-side layout
  const { containerRef, scale, designWidth: DESIGN_W, designHeight: DESIGN_H, isLandscape } = useAdaptiveFitScale({
    landscape: { w: 420, h: 260 },
    portrait: { w: 280, h: 380 },
  });

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="20"
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className={`flex ${isLandscape ? 'items-center gap-8' : 'flex-col items-center justify-center'} p-6`}
      >
        {/* Club Image */}
        <div
          className={`${isLandscape ? 'w-36 h-36' : 'w-40 h-40'} rounded-full overflow-hidden border-4 ${isLandscape ? '' : 'mb-4'} transition-all duration-700 flex-shrink-0`}
          style={{ borderColor: theme.accent }}
        >
          {current?.image ? (
            <img
              key={current.id}
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/30"
              style={{ backgroundColor: `${theme.primary}60` }}
            >
              {current?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Club details */}
        <div className={isLandscape ? 'flex min-w-0 flex-1 flex-col justify-center' : 'flex w-full flex-col items-center'}>
          {/* Header */}
          {isLandscape && (
            <div
              className="mb-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: theme.accent }}
            >
              Club Spotlight
            </div>
          )}
          {!isLandscape && (
            <div
              className="mb-4 text-sm font-semibold uppercase tracking-wide"
              style={{ color: theme.accent }}
            >
              Club Spotlight
            </div>
          )}

          {/* Club Name */}
          <div
            className={`${isLandscape ? 'text-left text-[2rem]' : 'text-center text-2xl'} font-bold leading-tight text-white`}
          >
            {current?.name || 'Loading...'}
          </div>

          {/* Error / defaults notice */}
          {error && usingDefaults && (
            <div className="text-xs text-white/40 mt-2">Sample data — configure CORS proxy to load clubs</div>
          )}
        </div>

        {/* QR Code */}
        {showQrCode && qrDataUrl && (
          <div className={`flex flex-col items-center flex-shrink-0 ${isLandscape ? '' : 'mt-3'}`}>
            <img
              src={qrDataUrl}
              alt={qrLabel}
              className="w-16 h-16 rounded"
              style={{ objectFit: 'contain' }}
            />
            {qrLabel && (
              <span className="text-[9px] text-white/50 mt-1 whitespace-nowrap">{qrLabel}</span>
            )}
          </div>
        )}
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'club-spotlight',
  name: 'Club Spotlight',
  description: 'Rotating spotlight of campus clubs from Over The Edge',
  icon: 'users',
  minW: 2,
  minH: 2,
  maxW: 6,
  maxH: 6,
  defaultW: 3,
  defaultH: 3,
  component: ClubSpotlight,
  OptionsComponent: ClubSpotlightOptions,
  acceptsSources: [{
    propName: 'apiUrl',
    types: ['api'],
    matchSource: (source) =>
      resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-clubs',
    applySource: (source) => ({
      apiUrl: source.url,
      sourceAdapter: 'unbc-clubs',
    }),
  }],
  defaultProps: {
    apiUrl: '',
    pageUrl: '',
    rotationSeconds: 10,
    useCorsProxy: false,
    refreshMinutes: 30,
    showQrCode: false,
    qrLabel: 'Learn more',
  },
});
