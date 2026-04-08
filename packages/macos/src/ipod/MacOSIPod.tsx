'use client';

import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSIPodOptions from './MacOSIPodOptions';
import { MacOSInset } from '../shared/ui';

interface IpodConfig {
  title?: string;
  artist?: string;
  album?: string;
  audioUrl?: string;
  coverUrl?: string;
  accentColor?: string;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function MacOSIPod({ config }: WidgetComponentProps) {
  const playerConfig = (config ?? {}) as IpodConfig;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const accentColor = playerConfig.accentColor ?? '#70b86c';

  useEffect(() => {
    if (!playerConfig.audioUrl) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = new Audio(playerConfig.audioUrl);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playerConfig.audioUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const coverStyle = useMemo(
    () =>
      playerConfig.coverUrl
        ? { backgroundImage: `url(${playerConfig.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: `radial-gradient(circle at top left, ${accentColor}, #253543 68%)` },
    [accentColor, playerConfig.coverUrl],
  );

  return (
    <div
      className="relative flex h-full min-h-0 items-center overflow-hidden rounded-[20px] px-[8px] pr-[10px]"
      style={{
        background:
          'linear-gradient(180deg, #e2e2e2 0%, #d6d6d6 12%, #cccccc 28%, #c0c0c0 45%, #b8b8b8 55%, #c0c0c0 68%, #cccccc 82%, #d6d6d6 100%)',
        boxShadow:
          '0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.72)',
        gap: 6,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.06) 12%, transparent 28%, rgba(255,255,255,0.04) 48%, transparent 65%, rgba(255,255,255,0.05) 82%, rgba(255,255,255,0.01) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-[2px] left-1/2 z-[2] h-[35%] max-h-[50px] -translate-x-1/2"
        style={{
          width: 'calc(100% - 6px)',
          borderRadius: '9999px 9999px 50% 50%',
          background: 'linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0))',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[2px] left-1/2 z-[2] h-[20%] max-h-[30px] -translate-x-1/2"
        style={{
          width: 'calc(100% - 10px)',
          borderRadius: '50% 50% 9999px 9999px',
          background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.25))',
        }}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_13rem] gap-4">
        <MacOSInset className="relative z-[1] flex min-h-0 flex-col overflow-hidden p-4" tone="dark">
          <div
            className="rounded-[16px] border border-black/25 p-3 text-[#0f2914]"
            style={{
              background:
                'linear-gradient(180deg, rgba(201,233,191,0.96), rgba(136,181,122,0.96))',
            }}
          >
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
              <div className="aspect-square rounded-[12px] border border-black/15 shadow-inner" style={coverStyle} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
                  Now playing
                </div>
                <div className="mt-1 overflow-hidden text-[18px] leading-tight font-macos-display text-[#18331c]">
                  <span className="macos-ipod-marquee">
                    {playerConfig.title?.trim() || 'Campus Groove'}
                  </span>
                </div>
                <div className="mt-2 text-[12px] font-semibold">
                  {playerConfig.artist?.trim() || 'Campus Hub'}
                </div>
                <div className="text-[11px] opacity-70">
                  {playerConfig.album?.trim() || 'Aqua Mix'}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 rounded-full bg-black/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(progress, 0.02) * 100}%`,
                    background: accentColor,
                  }}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </MacOSInset>
        <div className="flex items-center justify-center">
          <div
            className="relative z-[1] h-[12.5rem] w-[12.5rem] rounded-full border border-black/12 bg-[linear-gradient(180deg,#fdfdfd_0%,#ececec_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_rgba(0,0,0,0.12)]"
          >
            <button
              type="button"
              className="absolute left-1/2 top-4 -translate-x-1/2 text-[12px] font-semibold uppercase tracking-[0.28em] text-black/55"
              onClick={() => seekBy(-15)}
            >
              Menu
            </button>
            <button
              type="button"
              className="absolute left-5 top-1/2 -translate-y-1/2 text-black/55"
              onClick={() => seekBy(-10)}
            >
              <SkipBack size={24} />
            </button>
            <button
              type="button"
              className="absolute right-5 top-1/2 -translate-y-1/2 text-black/55"
              onClick={() => seekBy(10)}
            >
              <SkipForward size={24} />
            </button>
            <button
              type="button"
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 text-black/55"
              onClick={togglePlayback}
            >
              <Volume2 size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                {isPlaying ? 'Pause' : 'Play'}
              </span>
            </button>
            <button
              type="button"
              className="absolute left-1/2 top-1/2 flex h-[4.4rem] w-[4.4rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-[linear-gradient(180deg,#f7f7f7_0%,#dcdcdc_100%)] text-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

registerWidget({
  type: 'macos-ipod',
  name: 'macOS iPod',
  description: 'Aqua-era iPod mini player with cover art and playback controls',
  icon: 'music',
  minW: 3,
  minH: 3,
  defaultW: 4,
  defaultH: 3,
  component: MacOSIPod,
  OptionsComponent: MacOSIPodOptions,
  tags: ['retro', 'media'],
  defaultProps: {
    title: 'Campus Groove',
    artist: 'Campus Hub',
    album: 'Aqua Mix',
    audioUrl: '',
    coverUrl: '',
    accentColor: '#70b86c',
  },
});
