'use client';
import { useEffect, useState } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import WebOptions from './WebOptions';

interface WebConfig {
  url?: string;
  refreshInterval?: number;
  galleryDemo?: boolean;
}

function WebDemo({ theme }: { theme: WidgetComponentProps['theme'] }) {
  return (
    <div
      className="h-full w-full p-5"
      style={{
        background: `linear-gradient(180deg, ${theme.primary}44 0%, ${theme.background} 100%)`,
      }}
    >
      <div className="h-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl">
        <div
          className="grid gap-4 p-5 text-slate-900"
          style={{
            height: '100%',
            gridTemplateColumns: '1.2fr 0.8fr',
          }}
        >
          <div className="flex min-w-0 flex-col justify-between rounded-[24px] bg-slate-950 p-5 text-white">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Live Web Embed
              </div>
              <div className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Student Center
              </div>
              <div className="mt-4 text-2xl font-semibold leading-tight">
                Tonight&apos;s campus events are ready to publish.
              </div>
              <div className="mt-3 text-sm leading-relaxed text-white/65">
                Pull web content into signage layouts with a live embedded page preview.
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-950">
                View schedule
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">
                Share screen
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Quick Stats
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="text-[11px] text-slate-400">Open rooms</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">14</div>
                </div>
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="text-[11px] text-slate-400">Check-ins</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">238</div>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Featured
              </div>
              <div className="mt-3 space-y-3">
                {['Study jam at 7:00 PM', 'Late-night cafe menu', 'Board game social'].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const APP_ROUTE_PREFIX_PATTERN =
  /(\/display(?:\/|$)|\/screen(?:\/|$)|\/login(?:\/|$)|\/logout(?:\/|$)|\/configs(?:\/|$)|\/tvs(?:\/|$)|\/groups(?:\/|$)|\/playlists(?:\/|$)|\/schedules(?:\/|$)|\/auth(?:\/|$)|\/api(?:\/|$))/;

function resolveEmbedUrl(value: string) {
  if (typeof window === 'undefined' || !value) {
    return value;
  }

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
      mountPrefix && mountPrefix !== '/'
        ? mountPrefix.replace(/\/$/, '')
        : '';
    const baseUrl = `${window.location.origin}${normalizedPrefix}/`;
    const normalizedValue =
      normalizedPrefix &&
      value.startsWith('/') &&
      !value.startsWith(`${normalizedPrefix}/`)
        ? value.slice(1)
        : value;

    return new URL(normalizedValue, baseUrl).toString();
  }
}

export default function Web({ config, theme }: WidgetComponentProps) {
  const webConfig = config as WebConfig | undefined;
  const url = webConfig?.url ?? '';
  const refreshInterval = webConfig?.refreshInterval ?? 0;
  const galleryDemo = webConfig?.galleryDemo ?? false;
  const [iframeSrc, setIframeSrc] = useState(resolveEmbedUrl(url));

  useEffect(() => {
    setIframeSrc(resolveEmbedUrl(url));
  }, [url]);

  useEffect(() => {
    if (!url || refreshInterval <= 0) return;

    const updateSrc = () => {
      try {
        const nextUrl = new URL(resolveEmbedUrl(url));
        nextUrl.searchParams.set('_ts', Date.now().toString());
        setIframeSrc(nextUrl.toString());
      } catch {
        const separator = url.includes('?') ? '&' : '?';
        setIframeSrc(`${url}${separator}_ts=${Date.now()}`);
      }
    };

    const interval = setInterval(updateSrc, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [url, refreshInterval]);

  if (!url) {
    if (galleryDemo) {
      return <WebDemo theme={theme} />;
    }

    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="globe" className="w-9 h-9 mb-3 text-white/70" />
        <span className="text-white/70 text-sm">No URL configured</span>
        <span className="text-white/50 text-xs mt-1">Add a web URL in settings</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Web content"
      />
    </div>
  );
}

// Register the widget
registerWidget({
  type: 'web',
  name: 'Web Embed',
  description: 'Embed external web content',
  icon: 'globe',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: Web,
  OptionsComponent: WebOptions,
  acceptsSources: [{ propName: 'url', types: ['embed'] }],
  defaultProps: {
    url: '',
    refreshInterval: 0,
  },
});
