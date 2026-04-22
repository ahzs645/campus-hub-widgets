import { useEffect, useMemo, useRef, useState } from 'react';
import type Hls from 'hls.js';
import {
  AppIcon,
  WidgetComponentProps,
  buildProxyUrl,
  getCorsProxyUrl,
  registerWidget,
} from '@firstform/campus-hub-widget-sdk';
import StreamPlayerOptions from './StreamPlayerOptions';
import {
  buildYouTubeEmbedUrl,
  parseYouTubeLiveProbeHtml,
  resolveConfiguredStreamUrl,
  resolveStreamSource,
  type ResolvedStreamSource,
  type StreamFormat,
  type StreamPreset,
} from './stream-utils';

interface StreamPlayerConfig {
  preset?: StreamPreset;
  format?: StreamFormat;
  url?: string;
  fallbackUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  pollIntervalSeconds?: number;
  showStatus?: boolean;
}

interface LiveProbeState {
  status: 'idle' | 'checking' | 'live' | 'offline' | 'error';
  checkedAt?: number;
  resolvedUrl?: string;
  error?: string;
}

function clampPollInterval(seconds: number): number {
  if (!Number.isFinite(seconds)) return 300;
  return Math.max(30, Math.min(3600, Math.round(seconds)));
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const styles = {
    neutral: 'bg-black/55 text-white/85',
    success: 'bg-emerald-500/85 text-white',
    warning: 'bg-amber-500/85 text-black',
    danger: 'bg-red-500/85 text-white',
  }[tone];

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles}`}>
      {label}
    </span>
  );
}

function EmptyState({
  theme,
  title,
  detail,
  status,
}: {
  theme: WidgetComponentProps['theme'];
  title: string;
  detail: string;
  status?: React.ReactNode;
}) {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(145deg, ${theme.background}, ${theme.primary}33 58%, ${theme.accent}33)`,
      }}
    >
      <div className="flex h-full flex-col justify-between p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Stream Player
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <AppIcon name="satellite" className="h-7 w-7 text-white/85" />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">{title}</div>
                <div className="mt-1 text-sm text-white/65">{detail}</div>
              </div>
            </div>
          </div>
          {status}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/55">
          Supports YouTube, YouTube live channels, Vimeo, HLS, direct video/audio, and iframe embeds.
        </div>
      </div>
    </div>
  );
}

function resolveBadge(
  primary: ResolvedStreamSource | null,
  liveProbe: LiveProbeState,
  usingFallback: boolean,
  showStatus: boolean,
): React.ReactNode {
  if (!showStatus) return null;

  if (usingFallback) {
    return <StatusPill label="Fallback" tone="warning" />;
  }

  if (primary?.kind === 'youtube-live-probe') {
    if (liveProbe.status === 'live') {
      return <StatusPill label="Live" tone="success" />;
    }
    if (liveProbe.status === 'error') {
      return <StatusPill label="Error" tone="danger" />;
    }
    if (liveProbe.status === 'offline') {
      return <StatusPill label="Offline" tone="neutral" />;
    }
    return <StatusPill label="Checking" tone="neutral" />;
  }

  return null;
}

export default function StreamPlayer({ config, theme }: WidgetComponentProps) {
  const streamConfig = config as StreamPlayerConfig | undefined;
  const preset = (streamConfig?.preset ?? 'custom') as StreamPreset;
  const format = (streamConfig?.format ?? 'auto') as StreamFormat;
  const autoplay = streamConfig?.autoplay ?? true;
  const muted = streamConfig?.muted ?? true;
  const loop = streamConfig?.loop ?? true;
  const controls = streamConfig?.controls ?? true;
  const pollIntervalSeconds = clampPollInterval(streamConfig?.pollIntervalSeconds ?? 300);
  const showStatus = streamConfig?.showStatus ?? true;

  const playback = useMemo(
    () => ({ autoplay, muted, loop, controls }),
    [autoplay, muted, loop, controls],
  );

  const primaryUrl = resolveConfiguredStreamUrl(streamConfig?.url ?? '', preset);
  const primarySource = resolveStreamSource(primaryUrl, format, playback);
  const fallbackSource = resolveStreamSource(streamConfig?.fallbackUrl ?? '', 'auto', playback);

  const [liveProbe, setLiveProbe] = useState<LiveProbeState>({ status: 'idle' });
  const mediaRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (primarySource?.kind !== 'youtube-live-probe') {
      setLiveProbe({ status: 'idle' });
      return;
    }

    if (!getCorsProxyUrl()) {
      setLiveProbe({
        status: 'error',
        error: 'A CORS proxy is required to check YouTube live channel status.',
        checkedAt: Date.now(),
      });
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const probe = async () => {
      setLiveProbe((current) => ({
        ...current,
        status: 'checking',
      }));

      try {
        const response = await fetch(buildProxyUrl(primarySource.url), {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to load channel page (${response.status})`);
        }

        const html = await response.text();
        const result = parseYouTubeLiveProbeHtml(html);
        if (cancelled) return;

        if (result.isLive && result.videoId) {
          setLiveProbe({
            status: 'live',
            checkedAt: Date.now(),
            resolvedUrl: buildYouTubeEmbedUrl(result.videoId, playback),
          });
          return;
        }

        setLiveProbe({
          status: 'offline',
          checkedAt: Date.now(),
        });
      } catch (error) {
        if (cancelled) return;
        setLiveProbe({
          status: 'error',
          checkedAt: Date.now(),
          error: error instanceof Error ? error.message : 'Could not check YouTube live status.',
        });
      }
    };

    void probe();
    timer = window.setInterval(() => {
      void probe();
    }, pollIntervalSeconds * 1000);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [playback, pollIntervalSeconds, primarySource]);

  const usingFallback =
    primarySource?.kind === 'youtube-live-probe' &&
    (liveProbe.status === 'offline' || liveProbe.status === 'error') &&
    Boolean(fallbackSource);

  const activeSource = useMemo(() => {
    if (!primarySource) return null;

    if (primarySource.kind !== 'youtube-live-probe') {
      return primarySource;
    }

    if (liveProbe.resolvedUrl && (liveProbe.status === 'live' || liveProbe.status === 'checking')) {
      return {
        kind: 'youtube',
        sourceUrl: primarySource.sourceUrl,
        url: liveProbe.resolvedUrl,
      } as ResolvedStreamSource;
    }

    if ((liveProbe.status === 'offline' || liveProbe.status === 'error') && fallbackSource) {
      return fallbackSource;
    }

    return null;
  }, [fallbackSource, liveProbe, primarySource]);

  useEffect(() => {
    if (!activeSource || activeSource.kind !== 'hls' || !mediaRef.current) {
      return undefined;
    }

    const video = mediaRef.current;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeSource.url;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    let disposed = false;
    let hlsInstance: Hls | null = null;

    const attachHls = async () => {
      const { default: Hls } = await import('hls.js');
      if (disposed) return;

      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
        });
        hlsInstance.loadSource(activeSource.url);
        hlsInstance.attachMedia(video);
        return;
      }

      video.src = activeSource.url;
    };

    void attachHls();

    return () => {
      disposed = true;
      hlsInstance?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [activeSource]);

  const badge = resolveBadge(primarySource, liveProbe, usingFallback, showStatus);

  if (!primarySource) {
    return (
      <EmptyState
        theme={theme}
        title="No stream configured"
        detail="Add a URL, choose a format, or use the ISS preset."
      />
    );
  }

  if (!activeSource) {
    const checkedLabel = liveProbe.checkedAt
      ? `Last checked ${new Date(liveProbe.checkedAt).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })}`
      : 'Waiting for first check';

    return (
      <EmptyState
        theme={theme}
        title={
          liveProbe.status === 'error'
            ? 'Channel check failed'
            : liveProbe.status === 'offline'
              ? 'Channel is offline'
              : 'Checking live status'
        }
        detail={liveProbe.error ?? checkedLabel}
        status={badge}
      />
    );
  }

  const commonFrameProps = {
    className: 'h-full w-full border-0',
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    title: 'Stream content',
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
      {badge && (
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          {badge}
        </div>
      )}

      {activeSource.kind === 'youtube' || activeSource.kind === 'vimeo' ? (
        <iframe
          {...commonFrameProps}
          src={activeSource.url}
          allowFullScreen
        />
      ) : null}

      {activeSource.kind === 'embed' ? (
        <iframe
          {...commonFrameProps}
          src={activeSource.url}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        />
      ) : null}

      {activeSource.kind === 'video' || activeSource.kind === 'hls' ? (
        <video
          key={activeSource.url}
          ref={mediaRef}
          src={activeSource.kind === 'video' ? activeSource.url : undefined}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
          className="h-full w-full object-contain"
          playsInline
        />
      ) : null}

      {activeSource.kind === 'audio' ? (
        <div
          className="flex h-full flex-col items-center justify-center gap-4 p-5 text-white"
          style={{ backgroundColor: `${theme.primary}40` }}
        >
          <div className="rounded-2xl bg-black/20 p-4">
            <AppIcon name="music" className="h-10 w-10 text-white/85" />
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">Audio Stream</div>
            <div className="mt-1 text-sm text-white/60">{activeSource.sourceUrl}</div>
          </div>
          <audio
            key={activeSource.url}
            src={activeSource.url}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            controls={controls}
            className="w-full max-w-md"
          />
        </div>
      ) : null}
    </div>
  );
}

registerWidget({
  type: 'stream-player',
  name: 'Stream Player',
  description: 'Universal player for live feeds, YouTube channels, HLS, direct media, and embeds',
  icon: 'satellite',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: StreamPlayer,
  OptionsComponent: StreamPlayerOptions,
  acceptsSources: [
    { propName: 'url', types: ['video', 'embed', 'youtube', 'vimeo', 'google-drive'] },
    { propName: 'fallbackUrl', types: ['video', 'embed', 'youtube', 'vimeo', 'google-drive'] },
  ],
  defaultProps: {
    preset: 'custom',
    format: 'auto',
    url: '',
    fallbackUrl: '',
    autoplay: true,
    muted: true,
    loop: true,
    controls: true,
    pollIntervalSeconds: 300,
    showStatus: true,
  },
});
