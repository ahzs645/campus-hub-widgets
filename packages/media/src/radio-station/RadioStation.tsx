'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppIcon,
  WidgetComponentProps,
  buildProxyUrl,
  registerWidget,
} from '@firstform/campus-hub-widget-sdk';
import RadioStationOptions from './RadioStationOptions';
import {
  extractRadioNowPlaying,
  type RadioNowPlaying,
} from './radio-utils';

type RadioPlayerMode = 'none' | 'audio' | 'embed';
type MetadataState = 'idle' | 'loading' | 'live' | 'stale' | 'error';

interface RadioStationConfig {
  stationName?: string;
  stationTagline?: string;
  provider?: string;
  metadataUrl?: string;
  audioUrl?: string;
  embedUrl?: string;
  websiteUrl?: string;
  artworkUrl?: string;
  playerMode?: RadioPlayerMode;
  pollIntervalSeconds?: number;
  autoplay?: boolean;
  showArtwork?: boolean;
  showTimestamp?: boolean;
  useCorsProxy?: boolean;
}

const CFUR_STREAM_URL = 'https://listen.cfur.ca/mp3';
const CFUR_EMBED_URL = 'https://www.iheart.com/live/cfur-9357/?embed=true';
const CFUR_WEBSITE_URL = 'https://cfur.ca/listen-live';
const CFUR_ARTWORK_URL = 'https://i.iheart.com/v3/re/new_assets/621cef9099212de025af8a9d';
const DEMO_ROTATION_MS = 9_000;

const DEMO_TRACKS: RadioNowPlaying[] = [
  {
    title: 'Morning Tide',
    artist: 'The Northern Lights',
    album: 'Community Airwaves',
    showName: 'CFUR Morning Magazine',
    description: 'Demo metadata preview for the radio widget.',
    artworkUrl: CFUR_ARTWORK_URL,
    timestamp: 'Live demo feed',
    raw: null,
  },
  {
    title: 'Campus After Dark',
    artist: 'DJ Pinecone',
    album: 'Late Night Broadcast',
    showName: 'Night Shift',
    description: 'Shows how artist, title, and album stack inside the widget.',
    artworkUrl: CFUR_ARTWORK_URL,
    timestamp: 'Live demo feed',
    raw: null,
  },
  {
    title: 'Northbound',
    artist: 'Aurora Avenue',
    album: 'Studio Session',
    showName: 'Independent Spotlight',
    description: 'Reactive sample data rotates automatically until you link a live source.',
    artworkUrl: CFUR_ARTWORK_URL,
    timestamp: 'Live demo feed',
    raw: null,
  },
];

function clampPollInterval(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(10, Math.min(300, Math.round(value as number)));
}

function StatusChip({
  state,
  hasTrack,
}: {
  state: MetadataState;
  hasTrack: boolean;
}) {
  const styles = {
    idle: 'bg-white/10 text-white/70',
    loading: 'bg-white/10 text-white/85',
    live: 'bg-emerald-400/15 text-emerald-100',
    stale: 'bg-amber-400/15 text-amber-100',
    error: 'bg-rose-400/15 text-rose-100',
  }[state];

  const label = {
    idle: hasTrack ? 'Ready' : 'Waiting',
    loading: 'Checking',
    live: 'On Air',
    stale: hasTrack ? 'Last Known' : 'No Update',
    error: hasTrack ? 'Signal Lost' : 'Offline',
  }[state];

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles}`}>
      {label}
    </span>
  );
}

function formatTime(timestamp: number | undefined) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RadioStation({ config, theme }: WidgetComponentProps) {
  const radioConfig = config as RadioStationConfig | undefined;
  const stationName = radioConfig?.stationName?.trim() ?? '';
  const stationTagline = radioConfig?.stationTagline?.trim() ?? '';
  const provider = radioConfig?.provider?.trim() ?? '';
  const metadataUrl = radioConfig?.metadataUrl?.trim() ?? '';
  const audioUrl = radioConfig?.audioUrl?.trim() ?? '';
  const embedUrl = radioConfig?.embedUrl?.trim() ?? '';
  const websiteUrl = radioConfig?.websiteUrl?.trim() ?? '';
  const artworkUrl = radioConfig?.artworkUrl?.trim() ?? '';
  const playerMode = (radioConfig?.playerMode ?? 'audio') as RadioPlayerMode;
  const pollIntervalSeconds = clampPollInterval(radioConfig?.pollIntervalSeconds);
  const autoplay = radioConfig?.autoplay ?? false;
  const showArtwork = radioConfig?.showArtwork ?? true;
  const showTimestamp = radioConfig?.showTimestamp ?? true;
  const useCorsProxy = radioConfig?.useCorsProxy ?? false;
  const demoMode = !metadataUrl;

  const [metadataState, setMetadataState] = useState<MetadataState>('idle');
  const [nowPlaying, setNowPlaying] = useState<RadioNowPlaying | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | undefined>(undefined);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | undefined>(undefined);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const lastTrackRef = useRef<RadioNowPlaying | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    lastTrackRef.current = nowPlaying;
  }, [nowPlaying]);

  useEffect(() => {
    if (!demoMode) return undefined;

    let trackIndex = 0;
    setNowPlaying(DEMO_TRACKS[trackIndex]);
    setMetadataState('live');
    setMetadataError(null);
    setLastCheckedAt(Date.now());
    setLastSuccessAt(Date.now());

    const timer = window.setInterval(() => {
      trackIndex = (trackIndex + 1) % DEMO_TRACKS.length;
      const nextTimestamp = Date.now();
      setNowPlaying(DEMO_TRACKS[trackIndex]);
      setMetadataState('live');
      setLastCheckedAt(nextTimestamp);
      setLastSuccessAt(nextTimestamp);
    }, DEMO_ROTATION_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      return undefined;
    }

    if (!metadataUrl) {
      setMetadataState('idle');
      setNowPlaying(null);
      setMetadataError(null);
      setLastCheckedAt(undefined);
      setLastSuccessAt(undefined);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const pollMetadata = async () => {
      setMetadataState((current) => (current === 'idle' ? 'loading' : current));

      try {
        const response = await fetch(
          useCorsProxy ? buildProxyUrl(metadataUrl) : metadataUrl,
          { cache: 'no-store' }
        );

        const checkedAt = Date.now();
        if (cancelled) return;

        setLastCheckedAt(checkedAt);

        if (response.status === 204) {
          setMetadataError(null);
          setMetadataState(lastTrackRef.current ? 'stale' : 'idle');
          return;
        }

        if (!response.ok) {
          throw new Error(`Metadata request failed (${response.status})`);
        }

        const payload = await response.json();
        if (cancelled) return;

        const nextTrack = extractRadioNowPlaying(payload, metadataUrl);
        if (nextTrack) {
          lastTrackRef.current = nextTrack;
          setNowPlaying(nextTrack);
        }

        setMetadataError(null);
        setLastSuccessAt(checkedAt);
        setMetadataState(nextTrack ? 'live' : 'stale');
      } catch (error) {
        if (cancelled) return;
        setMetadataError(
          error instanceof Error ? error.message : 'Unable to refresh station metadata.'
        );
        setMetadataState(lastTrackRef.current ? 'stale' : 'error');
      }
    };

    void pollMetadata();
    timer = window.setInterval(() => {
      void pollMetadata();
    }, pollIntervalSeconds * 1000);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [demoMode, metadataUrl, pollIntervalSeconds, useCorsProxy]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playerMode !== 'audio' || !audioUrl) {
      setIsPlaying(false);
      setAudioError(null);
      return;
    }

    const handlePlay = () => {
      setIsPlaying(true);
      setAudioError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setAudioError('Audio stream could not be started.');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    audio.load();
    setAudioError(null);

    if (autoplay) {
      void audio.play().catch(() => {
        setAudioError('Autoplay was blocked by the browser.');
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoplay, playerMode]);

  const trackArtwork = nowPlaying?.artworkUrl || artworkUrl;
  const effectiveStationName = stationName || 'CFUR 88.7 FM';
  const effectiveProvider = provider || (demoMode ? 'Demo Station' : stationTagline || 'Live audio');
  const topLine =
    nowPlaying?.showName ||
    stationTagline ||
    (demoMode ? 'Reactive preview' : effectiveProvider);
  const secondaryLine =
    nowPlaying?.artist ||
    nowPlaying?.album ||
    nowPlaying?.description ||
    (metadataUrl ? 'Polling station metadata' : 'Link a source or enter a metadata URL.');

  const statusDetail = useMemo(() => {
    if (metadataState === 'live' && lastSuccessAt) {
      return `Updated ${formatTime(lastSuccessAt)}`;
    }
    if (metadataState === 'stale' && lastSuccessAt) {
      return `Last update ${formatTime(lastSuccessAt)}`;
    }
    if (metadataState === 'loading') {
      return 'Checking for current track information';
    }
    if (demoMode) {
      return 'Demo metadata preview. Link a live source to switch this widget to real station data.';
    }
    if (metadataError) {
      return metadataError;
    }
    if (metadataUrl) {
      return 'Waiting for the station to publish track metadata';
    }
    return 'No metadata source linked yet';
  }, [lastSuccessAt, metadataError, metadataState, metadataUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setAudioError('Playback was blocked by the browser.');
      }
      return;
    }

    audio.pause();
  };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 text-white"
      style={{
        background: `linear-gradient(160deg, ${theme.background} 0%, ${theme.primary}44 48%, ${theme.accent}55 100%)`,
      }}
    >
      {trackArtwork && showArtwork ? (
        <>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${trackArtwork})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(4,8,14,0.2),rgba(4,8,14,0.75))]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(4,8,14,0.08),rgba(4,8,14,0.32))]" />
      )}

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {effectiveProvider}
            </div>
            <div className="mt-1 text-xl font-semibold leading-tight">
              {effectiveStationName}
            </div>
            <div className="mt-1 text-sm text-white/65">{topLine}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusChip state={metadataState} hasTrack={Boolean(nowPlaying)} />
            {demoMode ? (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
                Demo
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 gap-4">
          {showArtwork ? (
            <div className="hidden w-28 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-black/20 sm:block">
              {trackArtwork ? (
                <img src={trackArtwork} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <AppIcon name="music" className="h-10 w-10 text-white/55" />
                </div>
              )}
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
              {nowPlaying?.showName ? 'On Air' : 'Now Playing'}
            </div>
            <div className="mt-2 text-2xl font-semibold leading-tight">
              {nowPlaying?.title || 'No current track title'}
            </div>
            <div className="mt-2 text-base text-white/72">
              {secondaryLine}
            </div>

            {nowPlaying?.album ? (
              <div className="mt-2 text-sm text-white/55">
                Album: {nowPlaying.album}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
              {statusDetail}
            </div>

            {(showTimestamp && (lastCheckedAt || nowPlaying?.timestamp)) ? (
              <div className="mt-3 text-xs text-white/45">
                {nowPlaying?.timestamp
                  ? `Station timestamp: ${nowPlaying.timestamp}`
                  : lastCheckedAt
                    ? `Last checked ${formatTime(lastCheckedAt)}`
                    : null}
              </div>
            ) : null}

            {metadataError && metadataState === 'error' ? (
              <div className="mt-3 text-sm text-rose-200/85">{metadataError}</div>
            ) : null}
          </div>
        </div>

        {playerMode === 'audio' && audioUrl && !demoMode ? (
          <div className="relative z-10 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Live Stream
              </div>
              <div className="flex items-center gap-2 pt-1 text-sm text-white/75">
                <span className={`inline-flex gap-1 ${isPlaying ? 'text-emerald-200' : 'text-white/40'}`}>
                  <span className={`h-3 w-1 rounded-full bg-current ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span className={`mt-0.5 h-2.5 w-1 rounded-full bg-current ${isPlaying ? 'animate-pulse [animation-delay:120ms]' : ''}`} />
                  <span className={`mt-1 h-2 w-1 rounded-full bg-current ${isPlaying ? 'animate-pulse [animation-delay:240ms]' : ''}`} />
                </span>
                <span>{isPlaying ? 'Playing live' : 'Ready to play'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={togglePlayback}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <AppIcon name="music" className="h-4 w-4" />
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <audio
              ref={audioRef}
              src={audioUrl}
              preload="none"
              autoPlay={autoplay}
            />
          </div>
        ) : null}

        {audioError ? (
          <div className="relative z-10 mt-2 text-sm text-rose-200/90">
            {audioError}
          </div>
        ) : null}

        {playerMode === 'embed' && embedUrl && !demoMode ? (
          <div className="relative z-10 mt-4 h-[108px] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <iframe
              src={embedUrl}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              title={`${effectiveStationName} embed`}
            />
          </div>
        ) : null}

        {websiteUrl || demoMode ? (
          <div className="relative z-10 mt-4 flex items-center justify-between text-sm text-white/60">
            <span>
              {demoMode
                ? 'Demo tracks rotate automatically'
                : metadataUrl
                  ? `Polling every ${pollIntervalSeconds}s`
                  : 'Station link configured'}
            </span>
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white/80 transition hover:bg-white/20"
              >
                Open station
              </a>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white/70">
                Link live source
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

registerWidget({
  type: 'radio-station',
  name: 'Radio Station',
  description: 'Show now-playing metadata for a live radio station with optional playback.',
  icon: 'music',
  minW: 4,
  minH: 2,
  defaultW: 6,
  defaultH: 3,
  component: RadioStation,
  OptionsComponent: RadioStationOptions,
  defaultProps: {
    stationName: 'CFUR 88.7 FM',
    stationTagline: 'Community-Campus Radio',
    provider: 'Demo Station',
    metadataUrl: '',
    audioUrl: '',
    embedUrl: '',
    websiteUrl: '',
    artworkUrl: CFUR_ARTWORK_URL,
    playerMode: 'audio',
    pollIntervalSeconds: 20,
    autoplay: false,
    showArtwork: true,
    showTimestamp: true,
    useCorsProxy: false,
  },
  acceptsSources: [
    {
      propName: 'metadataUrl',
      types: ['api'],
      matchSource: (source) =>
        source.url.includes('/live-meta/stream/') ||
        source.url.includes('currentTrackMeta'),
      applySource: (source, currentData) => {
        const isCFUR = source.url.includes('/stream/9357/currentTrackMeta');
        return {
          metadataUrl: source.url,
          stationName: isCFUR ? 'CFUR 88.7 FM' : source.name,
          stationTagline: isCFUR
            ? 'Community-Campus Radio'
            : (currentData.stationTagline as string | undefined) ?? source.description ?? '',
          provider: source.metadata?.provider ?? (currentData.provider as string | undefined) ?? '',
          artworkUrl:
            source.metadata?.thumbnailUrl ??
            (isCFUR ? CFUR_ARTWORK_URL : ((currentData.artworkUrl as string | undefined) ?? '')),
          audioUrl: isCFUR ? CFUR_STREAM_URL : ((currentData.audioUrl as string | undefined) ?? ''),
          embedUrl: isCFUR ? CFUR_EMBED_URL : ((currentData.embedUrl as string | undefined) ?? ''),
          websiteUrl: isCFUR ? CFUR_WEBSITE_URL : ((currentData.websiteUrl as string | undefined) ?? ''),
          pollIntervalSeconds: clampPollInterval(
            currentData.pollIntervalSeconds as number | undefined
          ),
          playerMode: (currentData.playerMode as RadioPlayerMode | undefined) ?? 'audio',
          useCorsProxy: false,
        };
      },
    },
  ],
});
