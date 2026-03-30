'use client';
import { useState, useEffect } from 'react';
import { WidgetComponentProps, registerWidget, ThemedContainer, Skeleton } from '@firstform/campus-hub-widget-sdk';
import { useFitScale } from '@firstform/campus-hub-widget-sdk';

// The word clock grid — each row is a string of characters
// Active words light up based on the current time
const GRID = [
  'ITLISASAMPM',
  'ACQUARTERDC',
  'TWENTYFIVEX',
  'HALFBTENFTO',
  'PASTERUNINE',
  'ONESIXTHREE',
  'FOURFIVETWO',
  'EIGHTELEVEN',
  'SEVENTWELVE',
  'TENSEOCLOCK',
];

interface WordMatch {
  row: number;
  start: number;
  end: number; // exclusive
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getTimeWords(hours: number, minutes: number): WordMatch[] {
  const matches: WordMatch[] = [];

  // "IT IS" always on
  matches.push({ row: 0, start: 0, end: 2 }); // IT
  matches.push({ row: 0, start: 3, end: 5 }); // IS

  const roundedMin = Math.floor(minutes / 5) * 5;
  const isPast = roundedMin > 0 && roundedMin <= 30;
  const isTo = roundedMin > 30;
  let displayHour = hours % 12;

  if (isTo) {
    displayHour = (displayHour + 1) % 12;
  }

  // Minute words
  switch (roundedMin) {
    case 0:
      // O'CLOCK
      matches.push({ row: 9, start: 5, end: 11 }); // OCLOCK
      break;
    case 5:
    case 55:
      matches.push({ row: 2, start: 6, end: 10 }); // FIVE (minute)
      break;
    case 10:
    case 50:
      matches.push({ row: 3, start: 5, end: 8 }); // TEN (minute)
      break;
    case 15:
    case 45:
      matches.push({ row: 1, start: 2, end: 9 }); // QUARTER
      break;
    case 20:
    case 40:
      matches.push({ row: 2, start: 0, end: 6 }); // TWENTY
      break;
    case 25:
    case 35:
      matches.push({ row: 2, start: 0, end: 10 }); // TWENTYFIVE
      break;
    case 30:
      matches.push({ row: 3, start: 0, end: 4 }); // HALF
      break;
  }

  // PAST or TO
  if (isPast) {
    matches.push({ row: 4, start: 0, end: 4 }); // PAST
  } else if (isTo) {
    matches.push({ row: 3, start: 9, end: 11 }); // TO
  }

  // Hour words
  const hourMap: Record<number, WordMatch> = {
    0: { row: 8, start: 5, end: 11 },  // TWELVE
    1: { row: 5, start: 0, end: 3 },   // ONE
    2: { row: 6, start: 8, end: 11 },  // TWO
    3: { row: 5, start: 6, end: 11 },  // THREE
    4: { row: 6, start: 0, end: 4 },   // FOUR
    5: { row: 6, start: 4, end: 8 },   // FIVE
    6: { row: 5, start: 3, end: 6 },   // SIX
    7: { row: 8, start: 0, end: 5 },   // SEVEN
    8: { row: 7, start: 0, end: 5 },   // EIGHT
    9: { row: 4, start: 7, end: 11 },  // NINE
    10: { row: 9, start: 0, end: 3 },  // TEN
    11: { row: 7, start: 5, end: 11 }, // ELEVEN
  };

  if (hourMap[displayHour]) {
    matches.push(hourMap[displayHour]);
  }

  return matches;
}

function buildActiveSet(matches: WordMatch[]): Set<string> {
  const active = new Set<string>();
  for (const m of matches) {
    for (let c = m.start; c < m.end; c++) {
      active.add(`${m.row}-${c}`);
    }
  }
  return active;
}

export default function WordClock({ config, theme }: WidgetComponentProps) {
  const [time, setTime] = useState<Date | null>(null);

  const { containerRef, containerWidth, containerHeight } = useFitScale(340, 360);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <Skeleton theme={theme} />
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const matches = getTimeWords(hours, minutes);
  const active = buildActiveSet(matches);

  const resolvedWidth = containerWidth || 340;
  const resolvedHeight = containerHeight || 360;
  const fillScale = clamp(Math.min(resolvedWidth / 280, resolvedHeight / 260), 1, 2);
  const layoutWidth = resolvedWidth / fillScale;
  const layoutHeight = resolvedHeight / fillScale;
  const cols = GRID[0]?.length ?? 11;
  const rows = GRID.length;
  const padX = clamp(layoutWidth * 0.05, 8, 18);
  const padY = clamp(layoutHeight * 0.05, 8, 18);
  const availableWidth = Math.max(layoutWidth - padX * 2, 80);
  const availableHeight = Math.max(layoutHeight - padY * 2, 100);
  const colGap = clamp(availableWidth * 0.003, 0.75, 2.5);
  const rowGap = clamp(availableHeight * 0.01, 1.25, 4);
  const cellWidth = Math.max((availableWidth - colGap * (cols - 1)) / cols, 10);
  const cellHeight = Math.max((availableHeight - rowGap * (rows - 1)) / rows, 10);
  const fontSize = clamp(Math.min(cellWidth * 0.92, cellHeight * 0.94), 10, 42);
  const inactiveColor = `${theme.accent}26`;
  const glowRadius = clamp(fontSize * 0.75, 6, 20);

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="08"
      className="flex items-center justify-center"
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: layoutWidth,
          height: layoutHeight,
          transform: `scale(${fillScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center"
          style={{
            padding: `${padY}px ${padX}px`,
          }}
        >
          {/* Grid */}
          <div
            className="select-none font-mono text-center"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: rowGap,
            }}
          >
            {GRID.map((row, ri) => (
              <div key={ri} className="flex justify-center" style={{ gap: colGap }}>
                {row.split('').map((char, ci) => {
                  const isActive = active.has(`${ri}-${ci}`);
                  return (
                    <span
                      key={ci}
                      className="inline-flex items-center justify-center font-bold transition-all duration-700"
                      style={{
                        width: cellWidth,
                        height: cellHeight,
                        fontSize,
                        lineHeight: 1,
                        letterSpacing: '0.03em',
                        color: isActive ? theme.accent : inactiveColor,
                        textShadow: isActive ? `0 0 ${glowRadius}px ${theme.accent}60` : 'none',
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'word-clock',
  name: 'Word Clock',
  description: 'Display time as illuminated words on a letter grid',
  icon: 'type',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: WordClock,
});
