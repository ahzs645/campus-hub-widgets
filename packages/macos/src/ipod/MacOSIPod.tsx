'use client';

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  registerWidget,
  useFitScale,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSIPodOptions from './MacOSIPodOptions';

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function MacOSIPod({ config }: WidgetComponentProps) {
  const playerConfig = (config ?? {}) as IpodConfig;
  const { containerRef, scale } = useFitScale(280, 150);
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

  const coverStyle = useMemo(
    () =>
      playerConfig.coverUrl
        ? { backgroundImage: `url(${playerConfig.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: `radial-gradient(circle at top left, ${accentColor}, #253543 68%)` },
    [accentColor, playerConfig.coverUrl],
  );
  const deviceScale = clamp(scale, 0.62, 1.02);
  const deviceWidth = 248;
  const deviceHeight = 118;
  const wheelSize = 74;
  const wheelCenterSize = 34;
  const displayWidth = 126;
  const displayHeight = 74;
  const displayRadius = displayHeight / 2;
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-0 items-center justify-center overflow-hidden"
    >
      <div
        className="relative"
        style={{
          width: deviceWidth,
          height: deviceHeight,
          transform: `scale(${deviceScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 24,
            background:
              'linear-gradient(180deg, #e2e2e2 0%, #d6d6d6 12%, #cccccc 28%, #c0c0c0 45%, #b8b8b8 55%, #c0c0c0 68%, #cccccc 82%, #d6d6d6 100%)',
            boxShadow:
              '0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 24,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.06) 12%, transparent 28%, rgba(255,255,255,0.04) 48%, transparent 65%, rgba(255,255,255,0.05) 82%, rgba(255,255,255,0.01) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute top-[2px] left-1/2 h-[35%] max-h-[42px] -translate-x-1/2"
          style={{
            width: 'calc(100% - 8px)',
            borderRadius: '24px 24px 50% 50%',
            background: 'linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0))',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[2px] left-1/2 h-[20%] max-h-[24px] -translate-x-1/2"
          style={{
            width: 'calc(100% - 14px)',
            borderRadius: '50% 50% 24px 24px',
            background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.2))',
          }}
        />

        <div
          className="relative z-[1] flex h-full items-center"
          style={{ gap: 10, padding: '18px 12px' }}
        >
          <div
            className="relative shrink-0"
            style={{
              width: wheelSize,
              height: wheelSize,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #f8f8f8 0%, #eee 100%)',
                border: '1px solid rgba(0,0,0,0.2)',
                boxShadow:
                  'inset 0 2px 3px rgba(0,0,0,0.08), inset 0 -1px 2px rgba(255,255,255,0.6)',
              }}
            />
            <button
              type="button"
              className="absolute left-1/2 top-[8px] -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/50"
              onClick={() => seekBy(-15)}
            >
              Menu
            </button>
            <button
              type="button"
              className="absolute left-[1px] top-1/2 flex h-7 w-[22px] -translate-y-1/2 items-center justify-center text-black/55"
              onClick={() => seekBy(-10)}
            >
              <SkipBack size={9} />
            </button>
            <button
              type="button"
              className="absolute right-[1px] top-1/2 flex h-7 w-[22px] -translate-y-1/2 items-center justify-center text-black/55"
              onClick={() => seekBy(10)}
            >
              <SkipForward size={9} />
            </button>
            <button
              type="button"
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/15 bg-[linear-gradient(180deg,#fff_0%,#f0f0f0_100%)] text-black/60 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
              style={{
                width: wheelCenterSize,
                height: wheelCenterSize,
              }}
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
            </button>
          </div>

          <div
            className="relative min-w-0 shrink-0 overflow-hidden"
            style={{
              width: displayWidth,
              height: displayHeight,
              borderRadius: displayRadius,
              display: 'flex',
              flexDirection: 'column',
              background:
                'linear-gradient(180deg, #d6ec82 0%, #c4e050 15%, #b0d63c 35%, #a0cc2c 55%, #94c420 75%, #8cbc18 100%)',
              border: '1px solid #6a8a14',
              boxShadow: [
                'inset 0 4px 6px rgba(0,0,0,0.3)',
                'inset 0 1px 1px rgba(0,0,0,0.2)',
                'inset 0 -3px 6px rgba(255,255,255,0.25)',
                'inset 0 -1px 1px rgba(255,255,255,0.4)',
                '0 1px 0 rgba(255,255,255,0.5)',
              ].join(', '),
            }}
          >
            <div
              className="flex flex-1 flex-col justify-end text-center"
              style={{
                padding: '0 14px 4px',
              }}
            >
              <div
                className="text-[8px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: '#47641a', opacity: 0.75 }}
              >
                Now Playing
              </div>
              {playerConfig.coverUrl ? (
                <div
                  className="mx-auto mt-1 h-5 w-5 rounded-[5px] border border-black/15 shadow-inner"
                  style={coverStyle}
                  aria-hidden
                />
              ) : null}
              <div
                className="mt-1 overflow-hidden whitespace-nowrap"
                style={{ textAlign: 'center' }}
              >
                <span
                  className="macos-ipod-marquee"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    color: '#1a3300',
                  }}
                >
                  {playerConfig.title?.trim() || 'Campus Groove'}
                </span>
              </div>
              <div
                className="truncate"
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  color: '#3a5a10',
                }}
              >
                {playerConfig.artist?.trim() || 'Campus Hub'}
              </div>
              <div
                className="truncate"
                style={{
                  fontSize: 9,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  color: '#4b651f',
                  opacity: 0.8,
                }}
              >
                {playerConfig.album?.trim() || 'Aqua Mix'}
              </div>
            </div>

            {playerConfig.audioUrl ? (
              <div
                className="mx-3 h-[3px] overflow-hidden rounded-[2px] bg-black/10"
              >
                <div
                  className="h-full rounded-[2px]"
                  style={{
                    width: `${Math.max(progress, 0) * 100}%`,
                    background: accentColor,
                    transition: 'width 160ms linear',
                  }}
                />
              </div>
            ) : (
              <div
                className="mx-3 h-px"
                style={{
                  background: 'rgba(0,0,0,0.08)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.12)',
                }}
              />
            )}

            <div
              className="flex flex-1 items-center justify-between px-3"
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  color: '#2a4a00',
                  letterSpacing: '0.03em',
                }}
              >
                {formatDuration(currentTime)}
              </span>
              <span
                className="truncate px-2 text-center"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  color: '#355610',
                }}
              >
                {isPlaying ? 'Playing' : playerConfig.audioUrl ? 'Paused' : 'Ready'}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  color: '#2a4a00',
                  letterSpacing: '0.03em',
                }}
              >
                {formatDuration(duration)}
              </span>
            </div>
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
