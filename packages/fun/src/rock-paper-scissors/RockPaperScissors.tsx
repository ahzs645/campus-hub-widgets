'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { WidgetComponentProps, registerWidget, DarkContainer } from '@firstform/campus-hub-widget-sdk';
import { useFitScale } from '@firstform/campus-hub-widget-sdk';
import RockPaperScissorsOptions from './RockPaperScissorsOptions';

interface RPSConfig {
  playInterval?: number;
}

// Inline SVG silhouettes (data URIs) used as CSS masks. Inlining keeps the
// game working offline / behind strict CSP — no dependency on a remote CDN,
// which previously left the hand area blank when the images failed to load.
const svgMask = (inner: string, viewBox: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${inner}</svg>`,
  )}")`;

const CHOICES = [
  {
    name: 'Rock',
    mask: svgMask(
      "<path fill='#000' d='M34 24c10-6 26-6 35 3s9 27 1 38-30 12-41 3S20 33 34 24z'/>",
      '0 0 100 100',
    ),
  },
  {
    name: 'Paper',
    mask: svgMask(
      "<path fill='#000' d='M28 10h34l18 18v62H28z'/>",
      '0 0 100 100',
    ),
  },
  {
    name: 'Scissors',
    mask: svgMask(
      "<g fill='none' stroke='#000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='6' r='3'/><circle cx='6' cy='18' r='3'/><line x1='20' y1='4' x2='8.12' y2='15.88'/><line x1='14.47' y1='14.48' x2='20' y2='20'/><line x1='8.12' y1='8.12' x2='12' y2='12'/></g>",
      '0 0 24 24',
    ),
  },
] as const;

export default function RockPaperScissors({ config, theme }: WidgetComponentProps) {
  const cfg = config as RPSConfig | undefined;
  const playInterval = cfg?.playInterval ?? 15;

  const { containerRef, scale } = useFitScale(200, 200);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCycling, setIsCycling] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    if (cycleRef.current) clearInterval(cycleRef.current);
  }, []);

  const doPlay = useCallback(() => {
    setIsCycling(true);
    setCycleCount(0);
    let count = 0;

    if (cycleRef.current) clearInterval(cycleRef.current);

    cycleRef.current = setInterval(() => {
      count++;
      setCurrentIndex(Math.floor(Math.random() * 3));
      setCycleCount(count);

      if (count >= 6) {
        if (cycleRef.current) clearInterval(cycleRef.current);
        setCurrentIndex(Math.floor(Math.random() * 3));
        setIsCycling(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    doPlay();
    playIntervalRef.current = setInterval(doPlay, playInterval * 1000);
    return clearTimers;
  }, [playInterval, doPlay, clearTimers]);

  const choice = CHOICES[currentIndex];

  return (
    <DarkContainer
      ref={containerRef}
      bg={theme.background}
      className="flex items-center justify-center"
      style={{ padding: 16 }}
    >
      <style>{`
        @keyframes rpsShake {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-8px); }
          75% { transform: translateY(8px); }
        }
      `}</style>
      <div
        style={{
          width: 200,
          height: 200,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="flex flex-col items-center justify-center gap-3"
      >
        <div
          style={{
            width: 90,
            height: 90,
            animation: isCycling ? 'rpsShake 400ms ease-in-out infinite' : 'none',
            backgroundColor: theme.accent,
            WebkitMaskImage: choice.mask,
            maskImage: choice.mask,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            filter: `drop-shadow(0 0 14px ${theme.primary}55)`,
          }}
        >
        </div>
        <div
          style={{
            color: theme.accent,
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          {choice.name}
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'rock-paper-scissors',
  name: 'Rock Paper Scissors',
  description: 'Auto-playing RPS game',
  icon: 'hand',
  minW: 2,
  minH: 2,
  defaultW: 2,
  defaultH: 2,
  component: RockPaperScissors,
  OptionsComponent: RockPaperScissorsOptions,
  defaultProps: { playInterval: 15 },
});
