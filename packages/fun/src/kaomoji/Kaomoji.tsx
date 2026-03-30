'use client';
import { useState, useEffect } from 'react';
import { WidgetComponentProps, registerWidget, DarkContainer } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale } from '@firstform/campus-hub-widget-sdk';
import KaomojiOptions from './KaomojiOptions';

interface KaomojiConfig {
  cycleInterval?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const KAOMOJI = [
  { face: '(◕‿◕)', mood: 'Happy' },
  { face: '(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧', mood: 'Excited' },
  { face: '(♥ω♥*)', mood: 'Love' },
  { face: '(・_・)', mood: 'Neutral' },
  { face: '(¬‿¬)', mood: 'Thinking' },
  { face: '(╥_╥)', mood: 'Sad' },
  { face: '(⊙_⊙)', mood: 'Surprised' },
  { face: '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)', mood: 'Shy' },
  { face: '(づ｡◕‿‿◕｡)づ', mood: 'Hug' },
  { face: '(ノಠ益ಠ)ノ彡┻━┻', mood: 'Angry' },
  { face: '(￣ω￣)', mood: 'Content' },
  { face: '(⌐■_■)', mood: 'Cool' },
];

export default function Kaomoji({ config: rawConfig, theme }: WidgetComponentProps) {
  const config = (rawConfig ?? {}) as KaomojiConfig;
  const cycleInterval = (config.cycleInterval ?? 5) * 1000;

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const {
    containerRef,
    containerWidth, containerHeight,
  } = useAdaptiveFitScale({
    landscape: { w: 320, h: 140 },
    portrait: { w: 200, h: 200 },
  });

  const resolvedWidth = containerWidth || 200;
  const resolvedHeight = containerHeight || 200;
  const padX = clamp(resolvedWidth * 0.08, 10, 22);
  const padY = clamp(resolvedHeight * 0.08, 10, 22);
  const innerWidth = Math.max(resolvedWidth - padX * 2, 80);
  const innerHeight = Math.max(resolvedHeight - padY * 2, 80);
  const current = KAOMOJI[index];
  const faceLength = Math.max(Array.from(current.face.replace(/\s+/g, '')).length, 4);
  const faceFontSize = clamp(
    Math.min(
      innerWidth / Math.max(faceLength * 0.48, 2.5),
      innerHeight * 0.46,
    ),
    18,
    64,
  );
  const moodFontSize = clamp(Math.min(faceFontSize * 0.24, innerHeight * 0.1), 9, 15);
  const gap = clamp(resolvedHeight * 0.04, 6, 12);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % KAOMOJI.length);
        setVisible(true);
      }, 500);
    }, cycleInterval);

    return () => clearInterval(timer);
  }, [cycleInterval]);

  return (
    <DarkContainer ref={containerRef} bg={theme.background}>
      <div
        style={{
          width: resolvedWidth,
          height: resolvedHeight,
          padding: `${padY}px ${padX}px`,
          boxSizing: 'border-box',
        }}
        className="flex flex-col items-center justify-center"
      >
        <div
          className="font-medium whitespace-nowrap transition-opacity duration-500 text-center"
          style={{
            opacity: visible ? 1 : 0,
            color: theme.accent,
            fontSize: faceFontSize,
            lineHeight: 1.05,
            maxWidth: innerWidth,
          }}
        >
          {current.face}
        </div>
        <div
          className="transition-opacity duration-500"
          style={{
            opacity: visible ? 1 : 0,
            color: theme.accent,
            fontFamily: 'var(--font-ndot, monospace)',
            fontSize: moodFontSize,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: gap,
            filter: 'opacity(0.6)',
          }}
        >
          {current.mood}
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'kaomoji',
  name: 'Kaomoji',
  description: 'Cycling Japanese emoticons',
  icon: 'smile',
  minW: 2,
  minH: 2,
  defaultW: 2,
  defaultH: 2,
  component: Kaomoji,
  OptionsComponent: KaomojiOptions,
  defaultProps: { cycleInterval: 5 },
});
