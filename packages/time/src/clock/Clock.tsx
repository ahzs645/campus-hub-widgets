'use client';
import { useState, useEffect } from 'react';
import { WidgetComponentProps, registerWidget, Skeleton } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale } from '@firstform/campus-hub-widget-sdk';
import ClockOptions from './ClockOptions';

interface ClockConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  format24h?: boolean;
  alignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'center' | 'bottom';
  style?: 'digital' | 'analog' | 'mosaic';
  /** Custom format string using Intl.DateTimeFormat tokens.
   *  Supports {br} delimiter for multi-line display (from Concerto).
   *  Examples: "h:mm a", "EEEE{br}MMM d{br}h:mm a" */
  customFormat?: string;
}

function AnalogClock({ time, theme, showSeconds }: { time: Date; theme: { primary: string; accent: string }; showSeconds: boolean }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Outer ring */}
      <circle cx="100" cy="100" r="95" fill="none" stroke={`${theme.accent}30`} strokeWidth="2" />
      <circle cx="100" cy="100" r="90" fill="none" stroke={`${theme.accent}15`} strokeWidth="1" />

      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const isQuarter = i % 3 === 0;
        const outerR = 88;
        const innerR = isQuarter ? 75 : 80;
        return (
          <line
            key={i}
            x1={100 + Math.cos(angle) * innerR}
            y1={100 + Math.sin(angle) * innerR}
            x2={100 + Math.cos(angle) * outerR}
            y2={100 + Math.sin(angle) * outerR}
            stroke={theme.accent}
            strokeWidth={isQuarter ? 3 : 1.5}
            strokeLinecap="round"
            opacity={isQuarter ? 1 : 0.6}
          />
        );
      })}

      {/* Minute tick marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * (Math.PI / 180);
        return (
          <circle
            key={`m-${i}`}
            cx={100 + Math.cos(angle) * 85}
            cy={100 + Math.sin(angle) * 85}
            r="0.8"
            fill={theme.accent}
            opacity="0.3"
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.cos((hourAngle - 90) * (Math.PI / 180)) * 50}
        y2={100 + Math.sin((hourAngle - 90) * (Math.PI / 180)) * 50}
        stroke={theme.accent}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Minute hand */}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.cos((minuteAngle - 90) * (Math.PI / 180)) * 70}
        y2={100 + Math.sin((minuteAngle - 90) * (Math.PI / 180)) * 70}
        stroke={theme.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Second hand */}
      {showSeconds && (
        <>
          <line
            x1={100 - Math.cos((secondAngle - 90) * (Math.PI / 180)) * 15}
            y1={100 - Math.sin((secondAngle - 90) * (Math.PI / 180)) * 15}
            x2={100 + Math.cos((secondAngle - 90) * (Math.PI / 180)) * 78}
            y2={100 + Math.sin((secondAngle - 90) * (Math.PI / 180)) * 78}
            stroke={theme.primary}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="3" fill={theme.primary} />
        </>
      )}

      {/* Center dot */}
      <circle cx="100" cy="100" r={showSeconds ? 2 : 4} fill={theme.accent} />
    </svg>
  );
}

function MosaicClock({ time, theme, showSeconds }: { time: Date; theme: { primary: string; accent: string }; showSeconds: boolean }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const cx = 100, cy = 100;

  function handRects(angle: number, length: number, size: number, color: string) {
    const rad = (angle - 90) * (Math.PI / 180);
    const step = size;
    const count = Math.floor(length / step);
    return Array.from({ length: count }).map((_, i) => {
      const d = (i + 1) * step;
      const x = cx + Math.cos(rad) * d - size / 2;
      const y = cy + Math.sin(rad) * d - size / 2;
      return <rect key={i} x={x} y={y} width={size} height={size} fill={color} />;
    });
  }

  // Dotted background grid
  const dots: React.JSX.Element[] = [];
  const spacing = 9;
  const radius = 85;
  for (let gx = cx - radius; gx <= cx + radius; gx += spacing) {
    for (let gy = cy - radius; gy <= cy + radius; gy += spacing) {
      const dist = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2);
      if (dist < radius) {
        dots.push(<circle key={`${gx}-${gy}`} cx={gx} cy={gy} r={2.5} fill={`${theme.accent}20`} />);
      }
    }
  }

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Clock face */}
      <circle cx={cx} cy={cy} r={90} fill={`${theme.accent}15`} />
      {/* Dotted background */}
      {dots}
      {/* Hour hand */}
      {handRects(hourAngle, 45, 12, theme.accent)}
      {/* Minute hand */}
      {handRects(minuteAngle, 72, 12, `${theme.accent}CC`)}
      {/* Second hand */}
      {showSeconds && handRects(secondAngle, 80, 10, theme.primary)}
      {/* Center square */}
      <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} fill={theme.accent} />
    </svg>
  );
}

/**
 * Format a Date using a simple token string.  Supports a subset of common
 * tokens so users can specify custom clock formats without adding date-fns.
 *
 * Supports multi-line via {br} delimiter (inspired by Concerto's ConcertoClock).
 */
function formatCustom(date: Date, formatStr: string, hour12: boolean): string[] {
  const segments = formatStr.split('{br}');
  return segments.map((seg) => {
    const trimmed = seg.trim();
    if (!trimmed) return '';

    // Build Intl options from common tokens
    const opts: Intl.DateTimeFormatOptions = {};
    if (/EEEE/.test(trimmed)) opts.weekday = 'long';
    else if (/EEE/.test(trimmed)) opts.weekday = 'short';
    if (/MMMM/.test(trimmed)) opts.month = 'long';
    else if (/MMM/.test(trimmed)) opts.month = 'short';
    else if (/MM/.test(trimmed) || /M\//.test(trimmed)) opts.month = '2-digit';
    if (/dd/.test(trimmed) || /d/.test(trimmed)) opts.day = 'numeric';
    if (/yyyy/.test(trimmed)) opts.year = 'numeric';
    if (/h:|H:/.test(trimmed)) { opts.hour = '2-digit'; opts.hour12 = hour12; }
    if (/mm/.test(trimmed) && /:/m.test(trimmed)) opts.minute = '2-digit';
    if (/ss/.test(trimmed)) opts.second = '2-digit';
    if (/\ba\b|am|pm/i.test(trimmed)) { opts.hour12 = true; }

    // If we parsed at least one option, use Intl; otherwise return the raw segment
    if (Object.keys(opts).length > 0) {
      return new Intl.DateTimeFormat([], opts).format(date);
    }
    return trimmed;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatDigitalTime(date: Date, showSeconds: boolean, format24h: boolean): {
  main: string;
  dayPeriod: string;
} {
  const formatter = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: !format24h,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts
      .filter((part) => part.type === type)
      .map((part) => part.value)
      .join('');

  return {
    main: [getPart('hour'), getPart('minute'), showSeconds ? getPart('second') : '']
      .filter(Boolean)
      .join(':'),
    dayPeriod: getPart('dayPeriod').toUpperCase(),
  };
}

export default function Clock({ config, theme }: WidgetComponentProps) {
  const [time, setTime] = useState<Date | null>(null);
  const clockConfig = config as ClockConfig | undefined;
  const showSeconds = clockConfig?.showSeconds ?? false;
  const showDate = clockConfig?.showDate ?? true;
  const format24h = clockConfig?.format24h ?? false;
  const clockStyle = clockConfig?.style ?? 'digital';
  const customFormat = clockConfig?.customFormat ?? '';
  const rawAlignment = clockConfig?.alignment;
  const alignment =
    rawAlignment === 'left' || rawAlignment === 'center' || rawAlignment === 'right'
      ? rawAlignment
      : 'right';
  const rawVerticalAlignment = clockConfig?.verticalAlignment;
  const verticalAlignment =
    rawVerticalAlignment === 'top' ||
    rawVerticalAlignment === 'center' ||
    rawVerticalAlignment === 'bottom'
      ? rawVerticalAlignment
      : 'top';

  const isAnalog = clockStyle === 'analog';
  const isMosaic = clockStyle === 'mosaic';

  // Adaptive dimensions: analog clock adapts between landscape/portrait,
  // digital clock swaps between wide banner and tall stacked layout
  const {
    containerRef,
    scale,
    designWidth: DESIGN_W,
    designHeight: DESIGN_H,
    isLandscape,
    containerWidth,
    containerHeight,
  } = useAdaptiveFitScale(
    isAnalog || isMosaic
      ? { landscape: { w: 300, h: 260 }, portrait: { w: 240, h: 300 } }
      : { landscape: { w: 320, h: 100 }, portrait: { w: 200, h: 140 } },
  );

  const alignmentStyles = {
    left: {
      containerClass: 'self-start items-start text-left',
      transformOriginX: 'left',
    },
    center: {
      containerClass: 'self-center items-center text-center',
      transformOriginX: 'center',
    },
    right: {
      containerClass: 'self-end items-end text-right',
      transformOriginX: 'right',
    },
  } as const;

  const verticalAlignmentStyles = {
    top: {
      containerClass: 'justify-start',
      transformOriginY: 'top',
    },
    center: {
      containerClass: 'justify-center',
      transformOriginY: 'center',
    },
    bottom: {
      containerClass: 'justify-end',
      transformOriginY: 'bottom',
    },
  } as const;

  const horizontalLayout = alignmentStyles[alignment];
  const verticalLayout = verticalAlignmentStyles[verticalAlignment];

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div
        ref={containerRef}
        className={`h-full flex flex-col p-4 ${verticalLayout.containerClass}`}
      >
        <Skeleton theme={theme} width="w-32" height="h-12" rounded="rounded" className={horizontalLayout.containerClass} />
      </div>
    );
  }

  const resolvedWidth = containerWidth || DESIGN_W;
  const resolvedHeight = containerHeight || DESIGN_H;
  const dateText = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (isAnalog || isMosaic) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden flex flex-col ${verticalLayout.containerClass}`}
      >
        <div
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: `${horizontalLayout.transformOriginX} ${verticalLayout.transformOriginY}`,
          }}
          className={`flex flex-col items-center justify-center ${horizontalLayout.containerClass}`}
        >
          <div className="w-[200px] h-[200px]">
            {isMosaic
              ? <MosaicClock time={time} theme={theme} showSeconds={showSeconds} />
              : <AnalogClock time={time} theme={theme} showSeconds={showSeconds} />
            }
          </div>
          {showDate && (
            <div className="text-sm opacity-80 mt-1 font-medium tracking-wide text-white/80 text-center">
              {dateText}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden flex flex-col ${verticalLayout.containerClass}`}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: `${clamp(resolvedHeight * 0.1, 8, 16)}px ${clamp(resolvedWidth * 0.06, 12, 22)}px`,
        }}
        className={`flex flex-col font-clock ${verticalLayout.containerClass} ${horizontalLayout.containerClass}`}
      >
        {customFormat ? (
          /* Custom format mode (inspired by Concerto's ConcertoClock) */
          <div className="flex flex-col" style={{ color: theme.accent }}>
            {(() => {
              const lines = formatCustom(time, customFormat, !format24h).filter(Boolean);
              const lineCount = Math.max(lines.length, 1);
              const longestLine = Math.max(...lines.map((line) => line.length), 6);
              const availableHeight = resolvedHeight - clamp(resolvedHeight * 0.1, 8, 16) * 2;
              const primaryFontSize = clamp(
                Math.min(resolvedWidth / Math.max(3.8, longestLine * 0.56), availableHeight / (lineCount > 1 ? 1.8 : 1.15)),
                16,
                56,
              );
              const secondaryFontSize = clamp(primaryFontSize * 0.52, 12, 28);

              return lines.map((line, i) => (
              <div
                key={i}
                className="font-bold tracking-tight tabular-nums whitespace-nowrap"
                style={{
                  fontSize: i === 0 ? primaryFontSize : secondaryFontSize,
                  opacity: i === 0 ? 1 : 0.8,
                  lineHeight: i === 0 ? 0.95 : 1.05,
                }}
              >
                {line}
              </div>
              ));
            })()}
          </div>
        ) : (
          (() => {
            const digitalTime = formatDigitalTime(time, showSeconds, format24h);
            const showDayPeriod = Boolean(digitalTime.dayPeriod) && !format24h;
            const availableHeight =
              resolvedHeight
              - clamp(resolvedHeight * 0.1, 8, 16) * 2
              - (showDate ? clamp(resolvedHeight * 0.2, 14, 24) : 0);
            const timeFontSize = clamp(
              Math.min(
                resolvedWidth / (showSeconds ? (showDayPeriod ? 7.2 : 6.1) : (showDayPeriod ? 5.8 : 4.9)),
                availableHeight * (showDayPeriod ? 0.95 : 1.05),
              ),
              20,
              72,
            );
            const dayPeriodFontSize = clamp(timeFontSize * 0.42, 11, 28);
            const dateFontSize = clamp(
              Math.min(resolvedWidth * 0.07, resolvedHeight * 0.18),
              10,
              20,
            );

            return (
              <>
                <div className="flex items-end gap-2 flex-wrap">
                  <div
                    className="font-bold tracking-tight tabular-nums whitespace-nowrap"
                    style={{ color: theme.accent, fontSize: timeFontSize, lineHeight: 0.92 }}
                  >
                    {digitalTime.main}
                  </div>
                  {showDayPeriod && (
                    <div
                      className="font-semibold tracking-[0.18em] whitespace-nowrap"
                      style={{ color: theme.accent, fontSize: dayPeriodFontSize, lineHeight: 1, paddingBottom: 2 }}
                    >
                      {digitalTime.dayPeriod}
                    </div>
                  )}
                </div>
                {showDate && (
                  <div
                    className="mt-1 font-medium tracking-wide text-white/80"
                    style={{ fontSize: dateFontSize, lineHeight: 1.05 }}
                  >
                    {dateText}
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}

// Register the widget
registerWidget({
  type: 'clock',
  name: 'Clock',
  description: 'Displays current time and date',
  icon: 'clock',
  minW: 2,
  minH: 1,
  defaultW: 3,
  defaultH: 1,
  component: Clock,
  OptionsComponent: ClockOptions,
  defaultProps: {
    showSeconds: false,
    showDate: true,
    format24h: false,
    alignment: 'right',
    verticalAlignment: 'top',
    style: 'digital',
    customFormat: '',
  },
});
