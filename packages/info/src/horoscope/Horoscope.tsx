'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
  useFitScale,
} from '@firstform/campus-hub-widget-sdk';
import HoroscopeOptions from './HoroscopeOptions';

type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

interface HoroscopeConfig {
  sign?: ZodiacSign;
  title?: string;
  showLucky?: boolean;
  showTraits?: boolean;
  tone?: 'balanced' | 'bold' | 'gentle';
}

interface SignMeta {
  sign: ZodiacSign;
  dates: string;
  glyph: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  mode: 'Cardinal' | 'Fixed' | 'Mutable';
  cue: string;
  guidance: string;
}

const SIGN_META: Record<ZodiacSign, SignMeta> = {
  Aries: {
    sign: 'Aries',
    dates: 'Mar 21 - Apr 19',
    glyph: '♈',
    element: 'Fire',
    mode: 'Cardinal',
    cue: 'Let it settle',
    guidance: 'Give new emotions time to settle instead of forcing an instant answer.',
  },
  Taurus: {
    sign: 'Taurus',
    dates: 'Apr 20 - May 20',
    glyph: '♉',
    element: 'Earth',
    mode: 'Fixed',
    cue: 'Use conviction',
    guidance: 'Honest passion can move people today, so let your conviction be visible.',
  },
  Gemini: {
    sign: 'Gemini',
    dates: 'May 21 - Jun 20',
    glyph: '♊',
    element: 'Air',
    mode: 'Mutable',
    cue: 'Trust your read',
    guidance: 'Make the choice that fits your judgment, not everyone else\'s expectations.',
  },
  Cancer: {
    sign: 'Cancer',
    dates: 'Jun 21 - Jul 22',
    glyph: '♋',
    element: 'Water',
    mode: 'Cardinal',
    cue: 'Stay composed',
    guidance: 'Lead with calm facts when a conversation feels bigger than your comfort zone.',
  },
  Leo: {
    sign: 'Leo',
    dates: 'Jul 23 - Aug 22',
    glyph: '♌',
    element: 'Fire',
    mode: 'Fixed',
    cue: 'Choose the spark',
    guidance: 'You can cut past small talk quickly, so be intentional about which spark you feed.',
  },
  Virgo: {
    sign: 'Virgo',
    dates: 'Aug 23 - Sep 22',
    glyph: '♍',
    element: 'Earth',
    mode: 'Mutable',
    cue: 'Release friction',
    guidance: 'Accepting disagreement will create more peace than trying to win every point.',
  },
  Libra: {
    sign: 'Libra',
    dates: 'Sep 23 - Oct 22',
    glyph: '♎',
    element: 'Air',
    mode: 'Cardinal',
    cue: 'Revive an idea',
    guidance: 'Bring one bold idea from an earlier version of yourself back into the present.',
  },
  Scorpio: {
    sign: 'Scorpio',
    dates: 'Oct 23 - Nov 21',
    glyph: '♏',
    element: 'Water',
    mode: 'Fixed',
    cue: 'Back yourself',
    guidance: 'Confidence matters more than polish, and people respond to the energy you believe.',
  },
  Sagittarius: {
    sign: 'Sagittarius',
    dates: 'Nov 22 - Dec 21',
    glyph: '♐',
    element: 'Fire',
    mode: 'Mutable',
    cue: 'Make room',
    guidance: 'Clear space for new people and better ideas instead of holding onto expired ones.',
  },
  Capricorn: {
    sign: 'Capricorn',
    dates: 'Dec 22 - Jan 19',
    glyph: '♑',
    element: 'Earth',
    mode: 'Cardinal',
    cue: 'Stay objective',
    guidance: 'Let curiosity grow slowly so affection does not outrun what you actually know.',
  },
  Aquarius: {
    sign: 'Aquarius',
    dates: 'Jan 20 - Feb 18',
    glyph: '♒',
    element: 'Air',
    mode: 'Fixed',
    cue: 'Let hope back in',
    guidance: 'An old relationship can feel new again if you leave room for renewed hope.',
  },
  Pisces: {
    sign: 'Pisces',
    dates: 'Feb 19 - Mar 20',
    glyph: '♓',
    element: 'Water',
    mode: 'Mutable',
    cue: 'Keep context',
    guidance: 'Treat overheard comments carefully because surprise without context is unreliable.',
  },
};

const OPENERS = {
  balanced: [
    'Today favors steady confidence.',
    'A small shift opens useful momentum.',
    'Your instincts are aligned with the pace of the day.',
  ],
  bold: [
    'Today rewards the move you have been hesitating to make.',
    'Your signal is strong; do not shrink it.',
    'Momentum builds fastest when you act before doubt catches up.',
  ],
  gentle: [
    'Today works best when you lead with patience.',
    'Soft attention reveals what pressure would miss.',
    'A calmer rhythm gives your intuition room to speak.',
  ],
} as const;

const FOCUS_AREAS = [
  'career',
  'friendships',
  'timing',
  'communication',
  'energy',
  'planning',
  'boundaries',
  'creativity',
  'rest',
  'follow-through',
];

const ACTIONS = [
  'Start with the conversation you have been postponing',
  'Protect one uninterrupted block for meaningful work',
  'Simplify your schedule before adding anything new',
  'Choose clarity over speed in a decision that affects others',
  'Notice which opportunity keeps returning and meet it halfway',
  'Turn a passing idea into a concrete next step',
];

const CAUTIONS = [
  'avoid overexplaining what already feels clear',
  'watch for distraction disguised as urgency',
  'leave room for a slower answer to arrive',
  'do not let someone else rush your priorities',
  'resist the impulse to solve every problem at once',
  'keep your attention away from old loops that drain momentum',
];

const CLOSES = [
  'By evening, the tone improves once you trust your own read.',
  'The more direct you are, the easier the day becomes.',
  'A quiet win lands when you keep your energy pointed at one thing.',
  'What seems minor early on becomes the useful pivot later.',
];

const LUCKY_COLORS = ['Amber', 'Emerald', 'Crimson', 'Cobalt', 'Saffron', 'Silver', 'Teal', 'Rose'];
const LUCKY_WINDOWS = ['8:15 AM', '10:40 AM', '1:20 PM', '4:05 PM', '6:45 PM', '9:10 PM'];
const DESIGN_W = 360;
const DESIGN_H = 240;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

  const clampedWeight = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clampedWeight);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

function hashString(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return Math.abs(hash >>> 0);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pick<T>(items: readonly T[], seed: number, offset: number): T {
  return items[(seed + offset) % items.length] as T;
}

function buildProfile(sign: ZodiacSign, tone: NonNullable<HoroscopeConfig['tone']>, today: Date) {
  const meta = SIGN_META[sign];
  const seed = hashString(`${sign}:${tone}:${dateKey(today)}`);
  const opener = pick(OPENERS[tone], seed, 1);
  const focus = pick(FOCUS_AREAS, seed, 3);
  const action = pick(ACTIONS, seed, 5);
  const close = pick(CLOSES, seed, 9);
  const luckyColor = pick(LUCKY_COLORS, seed, 11);
  const luckyWindow = pick(LUCKY_WINDOWS, seed, 13);
  const caution = pick(CAUTIONS, seed, 15);

  return {
    focus,
    luckyColor,
    luckyNumber: (seed % 89) + 11,
    luckyWindow,
    reading: `${opener} ${meta.guidance} ${action}. For ${focus}, ${caution}. ${close}`,
  };
}

function pillStyle(background: string, border: string, color: string, fontSize: number) {
  return {
    borderRadius: 999,
    padding: '5px 10px',
    background,
    border: `1px solid ${border}`,
    fontSize,
    color,
  };
}

export default function Horoscope({ config, theme }: WidgetComponentProps) {
  const horoscopeConfig = config as HoroscopeConfig | undefined;
  const sign = horoscopeConfig?.sign ?? 'Aries';
  const title = horoscopeConfig?.title?.trim() || 'Daily Horoscope';
  const showLucky = horoscopeConfig?.showLucky ?? true;
  const showTraits = horoscopeConfig?.showTraits ?? true;
  const tone = horoscopeConfig?.tone ?? 'balanced';
  const meta = SIGN_META[sign];
  const [today, setToday] = useState(() => new Date());
  const profile = useMemo(() => buildProfile(sign, tone, today), [sign, today, tone]);
  const { containerRef, containerWidth, containerHeight } = useFitScale(DESIGN_W, DESIGN_H);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(today);
  const shortDateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(today);
  const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);

  const frameWidth = Math.max(containerWidth || DESIGN_W, 120);
  const frameHeight = Math.max(containerHeight || DESIGN_H, 90);
  const aspectRatio = frameWidth / frameHeight;
  const tinyMode = frameWidth < 240 || frameHeight < 135;
  const compactMode = !tinyMode && (frameWidth < 370 || frameHeight < 210);
  const stackedBody = aspectRatio < 1.3 || frameWidth < 300;
  const expandedMode = frameWidth > 520 || frameHeight > 320;

  const shellRadius = clamp(Math.min(frameWidth, frameHeight) * 0.12, 16, 24);
  const shellPadX = clamp(frameWidth * (tinyMode ? 0.06 : compactMode ? 0.04 : 0.05), 10, 22);
  const shellPadY = clamp(frameHeight * (tinyMode ? 0.08 : compactMode ? 0.045 : 0.07), 8, 20);
  const sectionGap = clamp(Math.min(frameWidth, frameHeight) * 0.04, 8, 16);
  const headerTitleSize = clamp(Math.min(frameWidth * 0.032, frameHeight * 0.085), 9, 13);
  const signSize = clamp(
    Math.min(frameWidth * (tinyMode ? 0.11 : 0.1), frameHeight * 0.18),
    22,
    expandedMode ? 44 : 36,
  );
  const metaSize = clamp(Math.min(frameWidth * 0.034, frameHeight * 0.08), 10, 14);
  const badgeFontSize = clamp(Math.min(frameWidth * 0.03, frameHeight * 0.07), 10, 13);
  const readingSize = clamp(
    Math.min(frameWidth * 0.038, frameHeight * 0.085),
    tinyMode ? 11 : 12,
    expandedMode ? 19 : 16,
  );
  const cueGlyphSize = clamp(Math.min(frameWidth * 0.09, frameHeight * 0.22), 26, expandedMode ? 54 : 40);
  const cueLabelSize = clamp(Math.min(frameWidth * 0.026, frameHeight * 0.06), 9, 11);
  const cueTextSize = clamp(Math.min(frameWidth * 0.034, frameHeight * 0.075), 11, 15);
  const statLabelSize = clamp(Math.min(frameWidth * 0.025, frameHeight * 0.055), 9, 11);
  const statValueSize = clamp(Math.min(frameWidth * 0.05, frameHeight * 0.11), 14, expandedMode ? 24 : 19);
  const chipFontSize = clamp(Math.min(frameWidth * 0.028, frameHeight * 0.06), 10, 12);
  const readingLineClamp = tinyMode ? 2 : compactMode ? (frameHeight < 180 ? 3 : 4) : expandedMode ? 7 : 5;

  const showTitleLabel = !tinyMode || frameWidth > 180;
  const showDate = !tinyMode || frameWidth > 180;
  const showToneBadge = !tinyMode || frameWidth > 175;

  const statItems = [
    { label: 'Lucky No.', value: String(profile.luckyNumber) },
    { label: 'Lucky Color', value: profile.luckyColor },
    { label: 'Best Time', value: profile.luckyWindow },
  ];

  const compactSummary = `${meta.cue}. Focus on ${profile.focus}.`;
  const compactStats = statItems.slice(0, Math.min(statItems.length, frameWidth > 330 && frameHeight > 185 ? 2 : 1));
  const regularTraitItems = showTraits
    ? [meta.element, meta.mode, `Focus: ${profile.focus}`].slice(0, expandedMode ? 3 : 2)
    : [];
  const regularStats = statItems.slice(0, expandedMode || frameWidth > 430 ? 3 : 2);
  const showCompactGlyphTile = frameWidth > 320 && frameHeight > 175;
  const showCompactStats = showLucky && frameHeight > 166;
  const showRegularCueCard = frameHeight > 220 && frameWidth > 380;
  const showRegularTraitsRow = showTraits && frameHeight > 228;
  const showRegularStatsPanel = showLucky && frameHeight > 176;
  const microSummary = `${meta.cue}. Focus on ${profile.focus}.`;
  const readingCopy = tinyMode ? microSummary : profile.reading;

  const panelBg = theme.background;
  const shellBg = mixColors(theme.background, '#ffffff', 0.05);
  const shellBorder = mixColors(theme.background, '#ffffff', 0.13);
  const headlineColor = mixColors(theme.background, '#ffffff', 0.96);
  const bodyColor = mixColors(theme.background, '#ffffff', 0.84);
  const mutedColor = mixColors(theme.background, '#ffffff', 0.62);
  const subtleColor = mixColors(theme.background, '#ffffff', 0.38);
  const surfaceColor = mixColors(theme.background, '#ffffff', 0.08);
  const surfaceBorder = mixColors(theme.background, '#ffffff', 0.14);
  const accentSurface = mixColors(theme.background, theme.accent, 0.18);
  const accentBorder = mixColors(theme.background, theme.accent, 0.34);
  const emblemGlow = mixColors(theme.accent, '#ffffff', 0.18);
  const microBadgeText = showLucky ? `#${profile.luckyNumber}` : toneLabel;

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[22px]"
      style={{
        backgroundColor: panelBg,
        backgroundImage: `radial-gradient(circle at 82% 14%, ${mixColors(theme.background, theme.accent, 0.28)} 0%, transparent 24%), linear-gradient(145deg, ${mixColors(theme.background, theme.primary, 0.48)}, ${theme.background} 72%)`,
      }}
    >
      <div
        className="flex h-full flex-col"
        style={{
          width: '100%',
          height: '100%',
          padding: `${shellPadY}px ${shellPadX}px`,
          color: headlineColor,
        }}
      >
        <div
          className="flex h-full min-h-0 flex-col"
          style={{
            borderRadius: shellRadius,
            border: `1px solid ${shellBorder}`,
            background: `linear-gradient(180deg, ${shellBg}, ${mixColors(theme.background, '#000000', 0.04)})`,
            padding: `${shellPadY}px ${shellPadX}px`,
            boxShadow: `inset 0 1px 0 ${mixColors(theme.background, '#ffffff', 0.1)}`,
          }}
        >
          {tinyMode ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex shrink-0 items-center justify-center rounded-[14px]"
                    style={{
                      width: clamp(frameHeight * 0.44, 40, 58),
                      height: clamp(frameHeight * 0.44, 40, 58),
                      background: accentSurface,
                      border: `1px solid ${accentBorder}`,
                      color: headlineColor,
                      boxShadow: `0 0 22px ${emblemGlow}`,
                      fontSize: cueGlyphSize,
                      lineHeight: 1,
                    }}
                  >
                    {meta.glyph}
                  </div>
                  <div className="min-w-0">
                    {showTitleLabel && (
                      <div
                        style={{
                          fontSize: headerTitleSize,
                          color: theme.accent,
                          textTransform: 'uppercase',
                          letterSpacing: '0.16em',
                          fontWeight: 700,
                        }}
                      >
                        {title}
                      </div>
                    )}
                    <div
                      className="truncate"
                      style={{
                        fontSize: signSize,
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        marginTop: showTitleLabel ? 4 : 0,
                        color: headlineColor,
                        lineHeight: 1,
                      }}
                    >
                      {meta.sign}
                    </div>
                    {showDate && (
                      <div className="truncate" style={{ fontSize: metaSize, color: mutedColor, marginTop: 4 }}>
                        {shortDateLabel} | {meta.dates}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    ...pillStyle(accentSurface, accentBorder, theme.accent, badgeFontSize),
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showToneBadge ? toneLabel : microBadgeText}
                </div>
              </div>

              <div
                className="rounded-[16px]"
                style={{
                  marginTop: sectionGap,
                  background: surfaceColor,
                  border: `1px solid ${surfaceBorder}`,
                  padding: `${clamp(frameHeight * 0.08, 8, 12)}px ${clamp(frameWidth * 0.04, 10, 14)}px`,
                }}
              >
                <div
                  style={{
                    fontSize: readingSize,
                    lineHeight: 1.4,
                    color: bodyColor,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {readingCopy}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-2" style={{ paddingTop: sectionGap }}>
                {showTraits && (
                  <span style={pillStyle(surfaceColor, surfaceBorder, mutedColor, chipFontSize)}>
                    {meta.element}
                  </span>
                )}
                {showLucky && frameWidth > 180 && (
                  <span style={pillStyle(surfaceColor, surfaceBorder, mutedColor, chipFontSize)}>
                    {profile.luckyColor}
                  </span>
                )}
                {showLucky && frameWidth > 205 && (
                  <span style={pillStyle(surfaceColor, surfaceBorder, mutedColor, chipFontSize)}>
                    {profile.luckyWindow}
                  </span>
                )}
              </div>
            </div>
          ) : compactMode ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    style={{
                      fontSize: headerTitleSize,
                      color: theme.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      fontWeight: 700,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: signSize,
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      marginTop: 6,
                      color: headlineColor,
                      lineHeight: 1,
                    }}
                  >
                    {meta.sign}
                  </div>
                  <div className="truncate" style={{ fontSize: metaSize, color: mutedColor, marginTop: 5 }}>
                    {showDate ? `${meta.dates} | ${dateLabel}` : meta.dates}
                  </div>
                </div>

                <div
                  style={{
                    ...pillStyle(accentSurface, accentBorder, theme.accent, badgeFontSize),
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {toneLabel}
                </div>
              </div>

              <div className="mt-3 flex flex-1 min-h-0 flex-col" style={{ gap: sectionGap }}>
                <div className="flex min-h-0 items-stretch gap-3">
                  {showCompactGlyphTile && (
                    <div
                      className="flex shrink-0 items-center justify-center rounded-[16px]"
                      style={{
                        width: clamp(frameHeight * 0.34, 52, 70),
                        background: `linear-gradient(180deg, ${accentSurface}, ${mixColors(theme.background, '#000000', 0.08)})`,
                        border: `1px solid ${accentBorder}`,
                        boxShadow: `0 0 22px ${emblemGlow}`,
                        color: headlineColor,
                        fontSize: cueGlyphSize,
                        lineHeight: 1,
                      }}
                    >
                      {meta.glyph}
                    </div>
                  )}

                  <div
                    className="min-w-0 flex-1 rounded-[16px]"
                    style={{
                      background: surfaceColor,
                      border: `1px solid ${surfaceBorder}`,
                      padding: `${clamp(frameHeight * 0.06, 10, 13)}px ${clamp(frameWidth * 0.04, 12, 15)}px`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: readingSize,
                        lineHeight: 1.45,
                        color: bodyColor,
                        display: '-webkit-box',
                        WebkitLineClamp: frameHeight < 180 ? 2 : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {compactSummary}
                    </div>
                  </div>
                </div>

                {showCompactStats && (
                  <div
                    className="grid gap-2 rounded-[16px]"
                    style={{
                      background: surfaceColor,
                      border: `1px solid ${surfaceBorder}`,
                      padding: clamp(frameWidth * 0.028, 9, 12),
                      gridTemplateColumns: `repeat(${compactStats.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {compactStats.map((item) => (
                      <div key={item.label}>
                        <div
                          style={{
                            fontSize: statLabelSize,
                            color: subtleColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="truncate"
                          style={{
                            fontSize: statValueSize,
                            fontWeight: 700,
                            marginTop: 4,
                            color: headlineColor,
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    style={{
                      fontSize: headerTitleSize,
                      color: theme.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      fontWeight: 700,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: signSize,
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      marginTop: 6,
                      color: headlineColor,
                      lineHeight: 1,
                    }}
                  >
                    {meta.sign}
                  </div>
                  <div className="truncate" style={{ fontSize: metaSize, color: mutedColor, marginTop: 5 }}>
                    {showDate ? `${meta.dates} | ${dateLabel}` : meta.dates}
                  </div>
                </div>

                <div
                  style={{
                    ...pillStyle(accentSurface, accentBorder, theme.accent, badgeFontSize),
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {toneLabel}
                </div>
              </div>

              <div
                className="flex flex-1 min-h-0"
                style={{
                  gap: sectionGap,
                  marginTop: sectionGap,
                  flexDirection: stackedBody ? 'column' : 'row',
                }}
              >
                {showRegularCueCard && (
                  <div
                    className="shrink-0 rounded-[18px]"
                    style={{
                      width: stackedBody ? '100%' : clamp(frameWidth * 0.28, 92, 132),
                      background: `linear-gradient(180deg, ${accentSurface}, ${mixColors(theme.background, '#000000', 0.08)})`,
                      border: `1px solid ${accentBorder}`,
                      boxShadow: `0 0 28px ${emblemGlow}`,
                      padding: clamp(frameWidth * 0.03, 10, 14),
                      display: 'flex',
                      flexDirection: stackedBody ? 'row' : 'column',
                      alignItems: stackedBody ? 'center' : 'stretch',
                      gap: clamp(frameWidth * 0.025, 10, 16),
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-[14px]"
                      style={{
                        width: stackedBody ? clamp(frameHeight * 0.3, 54, 70) : '100%',
                        minWidth: stackedBody ? clamp(frameHeight * 0.3, 54, 70) : undefined,
                        height: stackedBody ? clamp(frameHeight * 0.3, 54, 70) : clamp(frameHeight * 0.3, 58, 82),
                        background: mixColors(theme.background, '#ffffff', 0.08),
                        color: headlineColor,
                        fontSize: cueGlyphSize,
                        lineHeight: 1,
                      }}
                    >
                      {meta.glyph}
                    </div>

                    <div className="min-w-0">
                      <div
                        style={{
                          fontSize: cueLabelSize,
                          color: subtleColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                        }}
                      >
                        Core Cue
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: cueTextSize,
                          color: bodyColor,
                          fontWeight: 700,
                          lineHeight: 1.25,
                        }}
                      >
                        {meta.cue}
                      </div>
                    </div>
                  </div>
                )}

                <div className="min-w-0 flex flex-1 flex-col">
                  <div
                    className="rounded-[16px]"
                    style={{
                      background: surfaceColor,
                      border: `1px solid ${surfaceBorder}`,
                      padding: `${clamp(frameHeight * 0.06, 10, 14)}px ${clamp(frameWidth * 0.04, 12, 16)}px`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: readingSize,
                        lineHeight: 1.5,
                        color: bodyColor,
                        display: '-webkit-box',
                        WebkitLineClamp: readingLineClamp,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {readingCopy}
                    </div>
                  </div>

                  {showRegularTraitsRow && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {regularTraitItems.map((item) => (
                        <span
                          key={item}
                          style={pillStyle(surfaceColor, surfaceBorder, mutedColor, chipFontSize)}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {showRegularStatsPanel && (
                <div
                  className="mt-3 grid gap-2 rounded-[16px]"
                  style={{
                    background: surfaceColor,
                    border: `1px solid ${surfaceBorder}`,
                    padding: clamp(frameWidth * 0.028, 9, 12),
                    gridTemplateColumns: `repeat(${regularStats.length}, minmax(0, 1fr))`,
                  }}
                >
                  {regularStats.map((item) => (
                    <div key={item.label}>
                      <div
                        style={{
                          fontSize: statLabelSize,
                          color: subtleColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="truncate"
                        style={{
                          fontSize: statValueSize,
                          fontWeight: 700,
                          marginTop: 4,
                          color: headlineColor,
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

registerWidget({
  type: 'horoscope',
  name: 'Daily Horoscope',
  description: 'A sign-specific daily horoscope with lucky details.',
  icon: 'sparkles',
  minW: 2,
  minH: 1,
  defaultW: 3,
  defaultH: 2,
  component: Horoscope,
  OptionsComponent: HoroscopeOptions,
  defaultProps: {
    sign: 'Aries',
    title: 'Daily Horoscope',
    showLucky: true,
    showTraits: true,
    tone: 'balanced',
  },
});
