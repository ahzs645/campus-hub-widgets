'use client';
import { useEffect, useState, useMemo } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import GoogleSheetsOptions from './GoogleSheetsOptions';

interface GoogleSheetsConfig {
  url?: string;
  sheetName?: string;
  cellRange?: string;
  showTitle?: boolean;
  title?: string;
  zoom?: number;
  refreshInterval?: number;
}

/**
 * Convert various Google Sheets URLs to the embed format.
 * Supports:
 *  - Full edit URL: https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0
 *  - Published URL: https://docs.google.com/spreadsheets/d/e/{ID}/pubhtml
 *  - Share URL: https://docs.google.com/spreadsheets/d/{ID}/...
 */
function buildEmbedUrl(config: GoogleSheetsConfig): string | null {
  const url = config.url?.trim();
  if (!url) return null;

  // If already an embed/pubhtml URL with /e/ prefix, use as-is with params
  if (url.includes('/pubhtml') || url.includes('/pub?')) {
    try {
      const u = new URL(url);
      if (config.cellRange) u.searchParams.set('range', config.cellRange);
      u.searchParams.set('widget', 'true');
      u.searchParams.set('headers', 'false');
      return u.toString();
    } catch {
      return url;
    }
  }

  // Extract spreadsheet ID from standard URLs
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) {
    // Fallback: treat as direct embed URL
    return url;
  }

  const spreadsheetId = idMatch[1];
  const params = new URLSearchParams();
  params.set('widget', 'true');
  params.set('headers', 'false');

  // Extract gid from URL if present
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  if (gidMatch) {
    params.set('gid', gidMatch[1]);
  } else if (config.sheetName) {
    params.set('sheet', config.sheetName);
  }

  if (config.cellRange) {
    params.set('range', config.cellRange);
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml?${params.toString()}`;
}

export default function GoogleSheetsWidget({ config, theme }: WidgetComponentProps) {
  const c = config as GoogleSheetsConfig | undefined;
  const zoom = c?.zoom ?? 100;
  const showTitle = c?.showTitle ?? false;
  const title = c?.title ?? '';
  const refreshInterval = c?.refreshInterval ?? 300;

  const embedUrl = useMemo(() => buildEmbedUrl(c ?? {}), [c?.url, c?.sheetName, c?.cellRange]);

  const [iframeSrc, setIframeSrc] = useState(embedUrl);

  useEffect(() => {
    setIframeSrc(embedUrl);
  }, [embedUrl]);

  // Auto-refresh (Google updates published sheets ~every 5 mins)
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
        <AppIcon name="table" className="w-9 h-9 mb-3 text-white/70" />
        <span className="text-white/70 text-sm">No Google Sheet configured</span>
        <span className="text-white/50 text-xs mt-1">Publish your sheet to the web and paste the URL</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {showTitle && title && (
        <div
          className="px-4 py-2 text-sm font-semibold shrink-0"
          style={{ backgroundColor: theme.primary, color: '#ffffff' }}
        >
          {title}
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-lg">
        <iframe
          src={iframeSrc ?? ''}
          className="border-0"
          style={{
            width: `${10000 / zoom}%`,
            height: `${10000 / zoom}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
          }}
          title="Google Sheets"
        />
      </div>
    </div>
  );
}

registerWidget({
  type: 'google-sheets',
  name: 'Google Sheets',
  description: 'Display data, updates, and charts from Google Sheets on your screens',
  icon: 'table',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: GoogleSheetsWidget,
  OptionsComponent: GoogleSheetsOptions,
  acceptsSources: [{ propName: 'url', types: ['embed'] }],
  defaultProps: {
    url: '',
    sheetName: '',
    cellRange: '',
    showTitle: false,
    title: '',
    zoom: 100,
    refreshInterval: 300,
  },
});
