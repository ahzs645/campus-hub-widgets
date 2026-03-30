'use client';
import { useState, useEffect } from 'react';
import { WidgetComponentProps, registerWidget, DarkContainer } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale } from '@firstform/campus-hub-widget-sdk';
import KaomojiOptions from './KaomojiOptions';

interface KaomojiConfig {
  cycleInterval?: number;
}

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
    containerRef, scale, designWidth: BASE_W, designHeight: DESIGN_H,
    containerWidth, containerHeight,
  } = useAdaptiveFitScale({
    landscape: { w: 320, h: 140 },
    portrait: { w: 200, h: 200 },
  });

  const DESIGN_W = containerWidth > 0 ? Math.max(BASE_W, containerWidth / scale) : BASE_W;
  const ACTUAL_H = containerHeight > 0 ? Math.max(DESIGN_H, containerHeight / scale) : DESIGN_H;

  // Scale face size to available space
  const faceFontSize = Math.min(DESIGN_W * 0.14, ACTUAL_H * 0.3, 64);

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

  const current = KAOMOJI[index];

  return (
    <DarkContainer ref={containerRef} bg={theme.background}>
      <div
        style={{
          width: DESIGN_W,
          height: ACTUAL_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="flex flex-col items-center justify-center"
      >
        <div
          className="font-medium whitespace-nowrap transition-opacity duration-500 text-center"
          style={{
            opacity: visible ? 1 : 0,
            color: theme.accent,
            fontSize: faceFontSize,
            lineHeight: 1.1,
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
            fontSize: Math.max(9, faceFontSize * 0.22),
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: 8,
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
