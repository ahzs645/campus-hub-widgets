'use client';
import { useMemo } from 'react';
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
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  mode: 'Cardinal' | 'Fixed' | 'Mutable';
}

const SIGN_META: Record<ZodiacSign, SignMeta> = {
  Aries: { sign: 'Aries', dates: 'Mar 21 - Apr 19', element: 'Fire', mode: 'Cardinal' },
  Taurus: { sign: 'Taurus', dates: 'Apr 20 - May 20', element: 'Earth', mode: 'Fixed' },
  Gemini: { sign: 'Gemini', dates: 'May 21 - Jun 20', element: 'Air', mode: 'Mutable' },
  Cancer: { sign: 'Cancer', dates: 'Jun 21 - Jul 22', element: 'Water', mode: 'Cardinal' },
  Leo: { sign: 'Leo', dates: 'Jul 23 - Aug 22', element: 'Fire', mode: 'Fixed' },
  Virgo: { sign: 'Virgo', dates: 'Aug 23 - Sep 22', element: 'Earth', mode: 'Mutable' },
  Libra: { sign: 'Libra', dates: 'Sep 23 - Oct 22', element: 'Air', mode: 'Cardinal' },
  Scorpio: { sign: 'Scorpio', dates: 'Oct 23 - Nov 21', element: 'Water', mode: 'Fixed' },
  Sagittarius: { sign: 'Sagittarius', dates: 'Nov 22 - Dec 21', element: 'Fire', mode: 'Mutable' },
  Capricorn: { sign: 'Capricorn', dates: 'Dec 22 - Jan 19', element: 'Earth', mode: 'Cardinal' },
  Aquarius: { sign: 'Aquarius', dates: 'Jan 20 - Feb 18', element: 'Air', mode: 'Fixed' },
  Pisces: { sign: 'Pisces', dates: 'Feb 19 - Mar 20', element: 'Water', mode: 'Mutable' },
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
  const seed = hashString(`${sign}:${tone}:${dateKey(today)}`);
  const opener = pick(OPENERS[tone], seed, 1);
  const focus = pick(FOCUS_AREAS, seed, 3);
  const action = pick(ACTIONS, seed, 5);
  const caution = pick(CAUTIONS, seed, 7);
  const close = pick(CLOSES, seed, 9);
  const luckyColor = pick(LUCKY_COLORS, seed, 11);
  const luckyWindow = pick(LUCKY_WINDOWS, seed, 13);

  return {
    focus,
    luckyColor,
    luckyNumber: (seed % 89) + 11,
    luckyWindow,
    reading: `${opener} ${action.toLowerCase()}. For ${focus}, ${caution}. ${close}`,
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
  const today = useMemo(() => new Date(), []);
  const profile = useMemo(() => buildProfile(sign, tone, today), [sign, today, tone]);
  const { containerRef, scale } = useFitScale(360, 240);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(today);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[22px]"
      style={{
        background: `radial-gradient(circle at top right, ${theme.accent}33 0%, transparent 28%), linear-gradient(145deg, ${theme.primary}, ${theme.background} 72%)`,
      }}
    >
      <div
        style={{
          width: 360,
          height: 240,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          padding: 18,
          color: '#ffffff',
        }}
      >
        <div
          className="flex h-full flex-col rounded-[20px]"
          style={{
            border: `1px solid ${theme.accent}2f`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            padding: 16,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div style={{ fontSize: 12, color: `${theme.accent}`, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700 }}>
                {title}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>
                {meta.sign}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>
                {meta.dates} • {dateLabel}
              </div>
            </div>
            <div
              style={{
                borderRadius: 999,
                padding: '6px 10px',
                border: `1px solid ${theme.accent}44`,
                background: `${theme.accent}14`,
                color: theme.accent,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tone}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.9)',
              flex: 1,
            }}
          >
            {profile.reading}
          </div>

          {showTraits && (
            <div className="mt-3 flex gap-2">
              {[meta.element, meta.mode, `Focus: ${profile.focus}`].map((item) => (
                <span
                  key={item}
                  style={{
                    borderRadius: 999,
                    padding: '5px 10px',
                    background: 'rgba(255,255,255,0.08)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.78)',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {showLucky && (
            <div
              className="mt-3 grid grid-cols-3 gap-2 rounded-[16px]"
              style={{
                background: 'rgba(0,0,0,0.16)',
                padding: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Lucky No.
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{profile.luckyNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Lucky Color
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{profile.luckyColor}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Best Time
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{profile.luckyWindow}</div>
              </div>
            </div>
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
  minH: 2,
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
