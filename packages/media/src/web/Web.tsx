'use client';
import { useEffect, useState } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import WebOptions from './WebOptions';

interface WebConfig {
  url?: string;
  refreshInterval?: number;
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
  defaultProps: {
    url: '',
    refreshInterval: 0,
  },
});
