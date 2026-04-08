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
  galleryDemo?: boolean;
}

const DEMO_SHEET_COLUMNS = ['Name', 'Program', 'Status', 'Check-ins', 'Advisor'];
const DEMO_SHEET_ROWS = [
  ['Maya Chen', 'Engineering', 'Confirmed', '128', 'R. Patel'],
  ['Noah Kim', 'Design', 'Waitlist', '64', 'J. Ortiz'],
  ['Ava Singh', 'Biology', 'Confirmed', '112', 'L. Brown'],
  ['Liam Carter', 'Business', 'Pending', '41', 'S. Hall'],
  ['Emma Garcia', 'Media', 'Confirmed', '95', 'K. Lewis'],
];

function GoogleSheetsDemo({
  theme,
  showTitle,
  title,
  zoom,
}: {
  theme: WidgetComponentProps['theme'];
  showTitle: boolean;
  title: string;
  zoom: number;
}) {
  const scale = Math.max(0.82, Math.min(1.18, zoom / 100));

  return (
    <div
      className="h-full w-full p-4"
      style={{
        background: `linear-gradient(180deg, ${theme.primary}36 0%, ${theme.background} 100%)`,
      }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-emerald-900/15 bg-white shadow-2xl">
        {showTitle && title ? (
          <div
            className="px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {title}
          </div>
        ) : null}

        <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-600 px-4 py-2 text-white">
          <AppIcon name="brandGoogleSheets" className="h-4 w-4" />
          <div className="text-sm font-semibold">Admissions Dashboard</div>
          <div className="ml-auto text-[11px] font-medium text-emerald-100">
            Live summary
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#f8fafc] p-3 text-slate-800">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            }}
          >
            <div
              className="mb-3 grid overflow-hidden rounded-2xl border border-slate-200 bg-white text-[12px] shadow-sm"
              style={{
                gridTemplateColumns: '56px repeat(5, minmax(0, 1fr))',
              }}
            >
              <div className="border-r border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-400">
                #
              </div>
              {DEMO_SHEET_COLUMNS.map((column) => (
                <div
                  key={column}
                  className="border-r border-slate-200 bg-slate-50 px-3 py-2 font-semibold last:border-r-0"
                >
                  {column}
                </div>
              ))}

              {DEMO_SHEET_ROWS.map((row, rowIndex) => (
                <div key={row[0]} className="contents">
                  <div className="border-r border-t border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-400">
                    {rowIndex + 2}
                  </div>
                  {row.map((cell, cellIndex) => (
                    <div
                      key={`${row[0]}-${cellIndex}`}
                      className="border-r border-t border-slate-200 px-3 py-2 text-slate-700 last:border-r-0"
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: '1.2fr 0.8fr' }}
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Conversion Trend
                </div>
                <div className="mt-3 flex h-16 items-end gap-2">
                  {[38, 52, 48, 66, 74, 83, 92].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-xl"
                      style={{
                        height: `${height}%`,
                        background:
                          index === 6
                            ? theme.accent
                            : `linear-gradient(180deg, ${theme.primary}, ${theme.primary}88)`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Totals
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Confirmed</span>
                    <span className="font-semibold text-slate-900">335</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Pending</span>
                    <span className="font-semibold text-slate-900">41</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Waitlist</span>
                    <span className="font-semibold text-slate-900">64</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const galleryDemo = c?.galleryDemo ?? false;

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
    if (galleryDemo) {
      return (
        <GoogleSheetsDemo
          theme={theme}
          showTitle={showTitle}
          title={title || 'Enrollment Snapshot'}
          zoom={zoom}
        />
      );
    }

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
  icon: 'brandGoogleSheets',
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
