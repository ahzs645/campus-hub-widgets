'use client';
import { useEffect, useState } from 'react';
import {
  DarkContainer,
  WidgetComponentProps,
  registerWidget,
  useAdaptiveFitScale,
} from '@firstform/campus-hub-widget-sdk';
import FortuneCookieOptions from './FortuneCookieOptions';

interface FortuneCookieConfig {
  openInterval?: number;
}

type FortunePhase = 'closed' | 'cracking' | 'opened';

const CLOSED_COOKIE_URL = new URL('./fortune-cookie-closed.png', import.meta.url).href;
const OPEN_COOKIE_URL = new URL('./fortune-cookie-open.png', import.meta.url).href;

const FORTUNES = [
  'A kind choice today will ripple further than you expect.',
  'Good timing arrives when preparation quietly meets courage.',
  'Let curiosity lead. It already knows the shortcut.',
  'The small idea you keep revisiting deserves a real attempt.',
  'A fresh start can happen in the middle of the week.',
  'Your next win comes from finishing, not perfecting.',
  'Someone will remember the generosity you almost skipped.',
  'A steady pace will beat a dramatic sprint this time.',
  'Make room for surprise. It has been looking for an opening.',
  'A conversation you postpone may become the turning point.',
  'The obvious answer is useful. The bold answer is closer.',
  'Your calm is more convincing than your urgency.',
  'The door opens faster when you stop rehearsing the knock.',
  'A playful experiment will teach you more than a careful theory.',
  'Luck favors the person who actually sends the message.',
  'You are closer than you think to the version that feels settled.',
  'Something ordinary today will become a favorite memory later.',
  'Leave a little room in the plan. Opportunity dislikes a crowded schedule.',
  'Your next chapter begins with one unglamorous step.',
  'A bright idea arrives after the second draft, not before it.',
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColors(base: string, target: string, weight: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) return target;

  const clampedWeight = clamp(weight, 0, 1);
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clampedWeight);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

function getNextFortuneIndex(currentIndex: number): number {
  if (FORTUNES.length < 2) return currentIndex;
  return (currentIndex + 1 + Math.floor(Math.random() * (FORTUNES.length - 1))) % FORTUNES.length;
}

export default function FortuneCookie({ config, theme }: WidgetComponentProps) {
  const cfg = config as FortuneCookieConfig | undefined;
  const openInterval = cfg?.openInterval ?? 20;

  const {
    containerRef,
    scale,
    designWidth,
    designHeight,
    isLandscape,
  } = useAdaptiveFitScale({
    landscape: { w: 320, h: 220 },
    portrait: { w: 280, h: 320 },
  });

  const [phase, setPhase] = useState<FortunePhase>('closed');
  const [fortuneIndex, setFortuneIndex] = useState(0);

  const intervalMs = openInterval * 1000;
  const crackDurationMs = 650;
  const revealDurationMs = clamp(
    Math.round(intervalMs * 0.34),
    2600,
    Math.max(2600, intervalMs - 1800),
  );
  const initialDelayMs = clamp(Math.round(intervalMs * 0.22), 700, 2200);

  useEffect(() => {
    let nextOpenTimer: number | null = null;
    let revealTimer: number | null = null;
    let closeTimer: number | null = null;
    let cancelled = false;

    const clearTimers = () => {
      if (nextOpenTimer) window.clearTimeout(nextOpenTimer);
      if (revealTimer) window.clearTimeout(revealTimer);
      if (closeTimer) window.clearTimeout(closeTimer);
    };

    const runCycle = () => {
      if (cancelled) return;

      setPhase('cracking');

      revealTimer = window.setTimeout(() => {
        if (cancelled) return;

        setFortuneIndex((current) => getNextFortuneIndex(current));
        setPhase('opened');

        closeTimer = window.setTimeout(() => {
          if (cancelled) return;
          setPhase('closed');
        }, revealDurationMs);
      }, crackDurationMs);

      nextOpenTimer = window.setTimeout(runCycle, intervalMs);
    };

    setPhase('closed');
    nextOpenTimer = window.setTimeout(runCycle, initialDelayMs);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [crackDurationMs, initialDelayMs, intervalMs, revealDurationMs]);

  const headlineColor = mixColors(theme.background, '#FFFFFF', 0.97);
  const bodyColor = mixColors(theme.background, '#FFFFFF', 0.86);
  const softLine = mixColors(theme.background, '#FFFFFF', 0.16);
  const cookieGlow = mixColors(theme.primary, '#FFFFFF', 0.18);
  const cardBackground = mixColors(theme.background, '#FFFFFF', 0.06);
  const cardBorder = mixColors(theme.accent, '#FFFFFF', 0.18);
  const cookieImageUrl = phase === 'opened' ? OPEN_COOKIE_URL : CLOSED_COOKIE_URL;
  const fortune = FORTUNES[fortuneIndex];

  return (
    <DarkContainer
      ref={containerRef}
      bg={theme.background}
      className="flex items-center justify-center"
      style={{
        backgroundImage: `
          radial-gradient(circle at top left, ${theme.primary}30 0%, transparent 45%),
          radial-gradient(circle at bottom right, ${theme.accent}20 0%, transparent 50%),
          linear-gradient(var(--widget-theme-tint, transparent), var(--widget-theme-tint, transparent))
        `,
      }}
    >
      <style>{`
        @keyframes fortuneCookieShake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-3deg) scale(1.02); }
          50% { transform: rotate(3deg) scale(1.05); }
          80% { transform: rotate(-2deg) scale(1.02); }
        }

        @keyframes fortunePaperLift {
          0% { opacity: 0; transform: translateY(12px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          padding: isLandscape ? '18px 18px 16px' : '18px 18px 20px',
        }}
        className="flex items-center justify-center"
      >
        <div
          style={{
            width: isLandscape ? 268 : 244,
            padding: 0,
          }}
          className="flex flex-col items-center"
        >
          <div
            className="relative flex items-center justify-center shrink-0 w-full"
            style={{
              height: isLandscape ? 92 : 108,
              marginBottom: 10,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: isLandscape ? 90 : 96,
                height: isLandscape ? 90 : 96,
                borderRadius: 999,
                background: `radial-gradient(circle, ${cookieGlow} 0%, transparent 70%)`,
                filter: 'blur(4px)',
              }}
            />
            <img
              src={cookieImageUrl}
              alt={phase === 'opened' ? 'Open fortune cookie' : 'Closed fortune cookie'}
              draggable={false}
              style={{
                width: isLandscape ? 86 : 94,
                height: isLandscape ? 86 : 94,
                objectFit: 'contain',
                userSelect: 'none',
                animation: phase === 'cracking' ? 'fortuneCookieShake 650ms ease-in-out' : 'none',
                transform: phase === 'opened' ? 'translateY(-2px) scale(1.02)' : 'scale(1)',
                transition: 'transform 220ms ease, filter 220ms ease',
                filter: `drop-shadow(0 14px 24px ${theme.background}88) drop-shadow(0 0 24px ${theme.accent}22)`,
              }}
            />
          </div>

          <div
            aria-live="polite"
            className="w-full"
            style={{
              minWidth: 0,
              minHeight: isLandscape ? 84 : 116,
              padding: isLandscape ? '16px 16px 14px' : '16px 15px 14px',
              borderRadius: 22,
              backgroundColor: cardBackground,
              border: `1px solid ${cardBorder}`,
              boxShadow: `inset 0 1px 0 ${mixColors(theme.background, '#FFFFFF', 0.08)}`,
              animation: phase === 'opened' ? 'fortunePaperLift 320ms ease-out' : 'none',
            }}
          >
            <p
              style={{
                minHeight: isLandscape ? 52 : 82,
                color: phase === 'opened' ? headlineColor : bodyColor,
                fontSize: isLandscape ? 17 : 18,
                lineHeight: 1.32,
                fontStyle: phase === 'opened' ? 'italic' : 'normal',
                margin: 0,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {phase === 'opened'
                ? `“${fortune}”`
                : 'A new note is almost ready.'}
            </p>
          </div>
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'fortune-cookie',
  name: 'Fortune Cookie',
  description: 'Cracks open on a set interval to reveal a new fortune',
  icon: 'sparkles',
  minW: 2,
  minH: 2,
  defaultW: 2,
  defaultH: 2,
  component: FortuneCookie,
  OptionsComponent: FortuneCookieOptions,
  defaultProps: {
    openInterval: 20,
  },
});
