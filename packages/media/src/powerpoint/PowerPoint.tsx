'use client';
import { useEffect, useMemo, useState } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import PowerPointOptions from './PowerPointOptions';
import { buildPowerPointEmbedUrl } from './powerpoint-utils';

interface PowerPointConfig {
  url?: string;
  refreshInterval?: number;
  showTitle?: boolean;
  title?: string;
  galleryDemo?: boolean;
}

function PowerPointDemo({
  theme,
  showTitle,
  title,
}: {
  theme: WidgetComponentProps['theme'];
  showTitle: boolean;
  title: string;
}) {
  return (
    <div
      className="h-full w-full p-4"
      style={{
        background: `linear-gradient(180deg, ${theme.primary}2b 0%, ${theme.background} 100%)`,
      }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-orange-950/10 bg-white shadow-2xl">
        {showTitle && title ? (
          <div
            className="px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {title}
          </div>
        ) : null}

        <div className="flex items-center gap-3 border-b border-orange-100 bg-[#d24726] px-4 py-2 text-white">
          <AppIcon name="slideshow" className="h-4 w-4" />
          <div className="text-sm font-semibold">Orientation Presentation</div>
          <div className="ml-auto text-[11px] font-medium text-orange-100">
            PowerPoint
          </div>
        </div>

        <div className="grid flex-1 gap-4 bg-[#fff7f5] p-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#d24726] via-[#b93b1e] to-[#862814] p-5 text-white">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Welcome Week
              </div>
              <div className="mt-4 text-3xl font-semibold leading-tight">
                Everything students need before classes begin.
              </div>
              <div className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                Use PowerPoint for campus briefings, digital noticeboards, sponsor decks, and
                self-advancing wayfinding presentations.
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#a23218]">
                Student Services
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/75">
                Auto-advance ready
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[22px] border border-orange-100 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">
                Slide Flow
              </div>
              <div className="mt-3 space-y-2">
                {[
                  'Campus map and parking',
                  'Health and counselling support',
                  'Library and study spaces',
                  'Events this week',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-orange-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-orange-500 shadow-sm">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-orange-100 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">
                Notes
              </div>
              <div className="mt-3 rounded-2xl bg-slate-950 px-4 py-4 text-sm leading-relaxed text-white/78">
                Best results come from PowerPoint for the web embed links or public direct `.pptx`
                files rendered through Office Web Viewer.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PowerPointWidget({ config, theme }: WidgetComponentProps) {
  const pptConfig = config as PowerPointConfig | undefined;
  const url = pptConfig?.url ?? '';
  const refreshInterval = pptConfig?.refreshInterval ?? 0;
  const showTitle = pptConfig?.showTitle ?? false;
  const title = pptConfig?.title ?? '';
  const galleryDemo = pptConfig?.galleryDemo ?? false;

  const embedUrl = useMemo(() => buildPowerPointEmbedUrl(url), [url]);
  const [iframeSrc, setIframeSrc] = useState(embedUrl);

  useEffect(() => {
    setIframeSrc(embedUrl);
  }, [embedUrl]);

  useEffect(() => {
    if (!embedUrl || refreshInterval <= 0) return;

    const updateSrc = () => {
      try {
        const nextUrl = new URL(embedUrl);
        nextUrl.searchParams.set('_ts', Date.now().toString());
        setIframeSrc(nextUrl.toString());
      } catch {
        const separator = embedUrl.includes('?') ? '&' : '?';
        setIframeSrc(`${embedUrl}${separator}_ts=${Date.now()}`);
      }
    };

    const interval = setInterval(updateSrc, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [embedUrl, refreshInterval]);

  if (!url) {
    if (galleryDemo) {
      return <PowerPointDemo theme={theme} showTitle={showTitle} title={title} />;
    }

    return (
      <div
        className="flex h-full flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="slideshow" className="mb-3 h-9 w-9 text-white/70" />
        <span className="text-sm text-white/70">No PowerPoint URL configured</span>
        <span className="mt-1 text-xs text-white/50">
          Add a PowerPoint embed link or a public .pptx URL in settings
        </span>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="warning" className="mb-3 h-9 w-9 text-white/75" />
        <span className="text-sm font-medium text-white/80">Unsupported PowerPoint link</span>
        <span className="mt-2 max-w-md text-xs leading-relaxed text-white/55">
          Use the official Embed link from PowerPoint for the web, or a public direct `.ppt` or
          `.pptx` file URL that Office Web Viewer can open.
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white">
      {showTitle && title ? (
        <div
          className="shrink-0 px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          {title}
        </div>
      ) : null}
      <iframe
        src={iframeSrc ?? ''}
        className="h-full w-full flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        title={title || 'PowerPoint presentation'}
      />
    </div>
  );
}

registerWidget({
  type: 'powerpoint',
  name: 'PowerPoint',
  description: 'Embed Microsoft PowerPoint presentations from Office on the web or public .pptx files',
  icon: 'slideshow',
  minW: 4,
  minH: 3,
  defaultW: 7,
  defaultH: 4,
  component: PowerPointWidget,
  OptionsComponent: PowerPointOptions,
  acceptsSources: [{ propName: 'url', types: ['powerpoint'] }],
  defaultProps: {
    url: '',
    refreshInterval: 0,
    showTitle: false,
    title: '',
  },
});
