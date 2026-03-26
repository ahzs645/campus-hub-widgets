'use client';
import { useEffect, useState } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import CanvaOptions from './CanvaOptions';

interface CanvaConfig {
  url?: string;
  refreshInterval?: number;
}

/**
 * Normalize a Canva URL to the embed format.
 * Canva "Smart embed" links look like:
 *   https://www.canva.com/design/{ID}/view?embed
 * Regular share links:
 *   https://www.canva.com/design/{ID}/view
 */
function buildCanvaEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    // Ensure it ends with the embed param
    if (u.hostname.includes('canva.com')) {
      if (!u.searchParams.has('embed')) {
        u.searchParams.set('embed', '');
      }
      return u.toString();
    }
    // Non-Canva URL - use as-is
    return trimmed;
  } catch {
    return null;
  }
}

export default function CanvaWidget({ config, theme }: WidgetComponentProps) {
  const c = config as CanvaConfig | undefined;
  const url = c?.url ?? '';
  const refreshInterval = c?.refreshInterval ?? 0;

  const embedUrl = buildCanvaEmbedUrl(url);
  const [iframeSrc, setIframeSrc] = useState(embedUrl);

  useEffect(() => {
    setIframeSrc(buildCanvaEmbedUrl(url));
  }, [url]);

  useEffect(() => {
    if (!embedUrl || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      try {
        const u = new URL(embedUrl);
        u.searchParams.set('_ts', Date.now().toString());
        setIframeSrc(u.toString());
      } catch {
        setIframeSrc(embedUrl);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [embedUrl, refreshInterval]);

  if (!embedUrl) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="palette" className="w-9 h-9 mb-3 text-white/70" />
        <span className="text-white/70 text-sm">No Canva design configured</span>
        <span className="text-white/50 text-xs mt-1">Paste your Canva smart embed link in settings</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <iframe
        src={iframeSrc ?? ''}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups"
        allow="fullscreen"
        title="Canva Design"
      />
    </div>
  );
}

registerWidget({
  type: 'canva',
  name: 'Canva',
  description: 'Display Canva designs directly on your screens via smart embed link',
  icon: 'palette',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: CanvaWidget,
  OptionsComponent: CanvaOptions,
  defaultProps: {
    url: '',
    refreshInterval: 0,
  },
});
