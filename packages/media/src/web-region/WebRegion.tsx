'use client';
import { createDemoImage, DemoBadge } from '@firstform/campus-hub-widgets-shared';
import { useWidgetPreview } from '@firstform/campus-hub-widget-sdk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, buildProxyUrl, useFitScale, type WidgetComponentProps } from '@firstform/campus-hub-widget-sdk';
import { VIEWPORT_H, VIEWPORT_W } from './meta';
export { VIEWPORT_H, VIEWPORT_W };

export interface WebRegionConfig {
  url?: string;
  refreshInterval?: number;
  regionX?: number;
  regionY?: number;
  regionW?: number;
  regionH?: number;
  fit?: 'cover' | 'contain';
  useCorsProxy?: boolean;
}

const APP_ROUTE_PREFIX_PATTERN =
  /(\/display(?:\/|$)|\/screen(?:\/|$)|\/login(?:\/|$)|\/logout(?:\/|$)|\/configs(?:\/|$)|\/tvs(?:\/|$)|\/groups(?:\/|$)|\/playlists(?:\/|$)|\/schedules(?:\/|$)|\/auth(?:\/|$)|\/api(?:\/|$))/;

export function resolveEmbedUrl(value: string) {
  if (typeof window === 'undefined' || !value) return value;
  try {
    return new URL(value).toString();
  } catch {
    const pathname = window.location.pathname;
    const routeMatch = pathname.match(APP_ROUTE_PREFIX_PATTERN);
    const mountPrefix = routeMatch
      ? pathname.slice(0, routeMatch.index)
      : pathname.endsWith('/')
        ? pathname.replace(/\/$/, '')
        : pathname.slice(0, pathname.lastIndexOf('/'));
    const normalizedPrefix =
      mountPrefix && mountPrefix !== '/' ? mountPrefix.replace(/\/$/, '') : '';
    const baseUrl = `${window.location.origin}${normalizedPrefix}/`;
    const normalizedValue =
      normalizedPrefix && value.startsWith('/') && !value.startsWith(`${normalizedPrefix}/`)
        ? value.slice(1)
        : value;
    return new URL(normalizedValue, baseUrl).toString();
  }
}

export function resolveWebRegionFrameUrl(value: string, useCorsProxy = false) {
  const resolvedUrl = resolveEmbedUrl(value);
  return useCorsProxy ? buildProxyUrl(resolvedUrl) : resolvedUrl;
}

export default function WebRegion({ config, theme }: WidgetComponentProps) {
  const webConfig = config as WebRegionConfig | undefined;
  const preview = useWidgetPreview();
  const url = preview ? '' : webConfig?.url ?? '';
  const refreshInterval = webConfig?.refreshInterval ?? 0;
  const regionX = webConfig?.regionX ?? 0;
  const regionY = webConfig?.regionY ?? 0;
  const regionW = webConfig?.regionW ?? VIEWPORT_W;
  const regionH = webConfig?.regionH ?? VIEWPORT_H;
  const fit = webConfig?.fit ?? 'cover';
  const useCorsProxy = webConfig?.useCorsProxy ?? false;

  const [iframeSrc, setIframeSrc] = useState(resolveWebRegionFrameUrl(url, useCorsProxy));
  const { containerRef, containerWidth, containerHeight } = useFitScale(regionW, regionH);

  useEffect(() => {
    setIframeSrc(resolveWebRegionFrameUrl(url, useCorsProxy));
  }, [url, useCorsProxy]);

  useEffect(() => {
    if (!url || refreshInterval <= 0) return;
    const updateSrc = () => {
      try {
        const next = new URL(resolveWebRegionFrameUrl(url, useCorsProxy));
        next.searchParams.set('_ts', Date.now().toString());
        setIframeSrc(next.toString());
      } catch {
        const frameUrl = resolveWebRegionFrameUrl(url, useCorsProxy);
        const sep = frameUrl.includes('?') ? '&' : '?';
        setIframeSrc(`${frameUrl}${sep}_ts=${Date.now()}`);
      }
    };
    const interval = setInterval(updateSrc, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [url, refreshInterval, useCorsProxy]);

  const { scale, tx, ty } = useMemo(() => {
    if (containerWidth === 0 || containerHeight === 0 || regionW === 0 || regionH === 0) {
      return { scale: 1, tx: 0, ty: 0 };
    }
    const sx = containerWidth / regionW;
    const sy = containerHeight / regionH;
    const s = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
    const cx = regionX + regionW / 2;
    const cy = regionY + regionH / 2;
    return {
      scale: s,
      tx: containerWidth / 2 - cx * s,
      ty: containerHeight / 2 - cy * s,
    };
  }, [containerWidth, containerHeight, regionX, regionY, regionW, regionH, fit]);

  if (!url) {
    return <div className="relative h-full w-full overflow-hidden rounded-lg"><img src={createDemoImage('Campus noticeboard', 2)} alt="Sample website region" className="h-full w-full object-cover" /><DemoBadge /></div>;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black">
      <iframe
        src={iframeSrc}
        title="Web region"
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{
          width: VIEWPORT_W,
          height: VIEWPORT_H,
          border: 0,
          transformOrigin: '0 0',
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

