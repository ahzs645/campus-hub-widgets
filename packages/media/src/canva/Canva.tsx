'use client';
import { useEffect, useState } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import CanvaOptions from './CanvaOptions';

interface CanvaConfig {
  url?: string;
  refreshInterval?: number;
  galleryDemo?: boolean;
}

function CanvaDemo() {
  return (
    <div className="h-full w-full p-5">
      <div
        className="grid h-full overflow-hidden rounded-[30px] border border-white/10 bg-[#201352] text-white shadow-2xl"
        style={{ gridTemplateColumns: '72px 1fr' }}
      >
        <div className="flex flex-col items-center gap-3 border-r border-white/10 bg-black/15 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <AppIcon name="brandCanva" className="h-5 w-5" />
          </div>
          {['+', 'T', '[]', 'Fx'].map((label) => (
            <div
              key={label}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white/75"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="relative flex items-center justify-center overflow-hidden p-5"
          style={{
            background:
              'radial-gradient(circle at top, rgba(121, 230, 255, 0.2), transparent 34%), linear-gradient(180deg, #3a1f82 0%, #140b36 100%)',
          }}
        >
          <div className="absolute right-4 top-4 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            Smart Embed
          </div>

          <div
            className="relative flex h-[82%] w-[62%] flex-col justify-between overflow-hidden rounded-[30px] border border-white/25 p-6 shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #06b6d4 100%)' }}
          >
            <div>
              <div className="inline-flex rounded-full bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                Open House
              </div>
              <div className="mt-4 text-3xl font-semibold leading-tight">
                Design assets for student recruitment
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-white/85">
              <div className="rounded-2xl bg-white/14 p-3 backdrop-blur-sm">
                Social kit
              </div>
              <div className="rounded-2xl bg-black/20 p-3 backdrop-blur-sm">
                Poster layout
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2 text-[11px]">
            <span className="rounded-full bg-black/25 px-3 py-1 text-white/70">
              Brand kit
            </span>
            <span className="rounded-full bg-black/25 px-3 py-1 text-white/70">
              Presentation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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
    if (u.hostname.includes('canva.com')) {
      if (u.search.includes('embed')) {
        return u.toString();
      }

      const query = u.search ? `${u.search}&embed` : '?embed';
      return `${u.origin}${u.pathname}${query}${u.hash}`;
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
  const galleryDemo = c?.galleryDemo ?? false;

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
    if (galleryDemo) {
      return <CanvaDemo />;
    }

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
  icon: 'brandCanva',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: CanvaWidget,
  OptionsComponent: CanvaOptions,
  acceptsSources: [{ propName: 'url', types: ['embed'] }],
  defaultProps: {
    url: '',
    refreshInterval: 0,
  },
});
