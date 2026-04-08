'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSClockOptions from './MacOSClockOptions';
import { MACOS_UI_FONT, MacOSDashboardSurface } from '../shared/ui';

interface ClockConfig {
  timezone?: string;
  cityLabel?: string;
  showSeconds?: boolean;
  showDigital?: boolean;
}

function inferCityLabel(timezone?: string) {
  if (!timezone) return 'Local';
  const parts = timezone.split('/');
  return (parts[parts.length - 1] ?? 'Local').replace(/_/g, ' ');
}

function handPolygon(
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  baseHalf: number,
  tailLength = 0,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const perpRad = rad + Math.PI / 2;
  const tipX = cx + length * Math.cos(rad);
  const tipY = cy + length * Math.sin(rad);
  const bx1 = cx + baseHalf * Math.cos(perpRad);
  const by1 = cy + baseHalf * Math.sin(perpRad);
  const bx2 = cx - baseHalf * Math.cos(perpRad);
  const by2 = cy - baseHalf * Math.sin(perpRad);

  if (tailLength > 0) {
    const tx = cx - tailLength * Math.cos(rad);
    const ty = cy - tailLength * Math.sin(rad);
    return `${bx1},${by1} ${tipX},${tipY} ${bx2},${by2} ${tx},${ty}`;
  }

  return `${bx1},${by1} ${tipX},${tipY} ${bx2},${by2}`;
}

function getZonedDate(now: Date, timezone?: string) {
  if (!timezone) return now;

  try {
    return new Date(
      now.toLocaleString('en-US', {
        timeZone: timezone,
      }),
    );
  } catch {
    return now;
  }
}

export default function MacOSClock({ config }: WidgetComponentProps) {
  const [now, setNow] = useState(() => new Date());
  const id = useId().replace(/:/g, '');
  const clockConfig = (config ?? {}) as ClockConfig;
  const showSeconds = clockConfig.showSeconds ?? true;
  const showDigital = clockConfig.showDigital ?? true;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const zonedDate = useMemo(
    () => getZonedDate(now, clockConfig.timezone),
    [now, clockConfig.timezone],
  );

  const hours = zonedDate.getHours();
  const isDark = hours >= 19 || hours < 6;
  const minutes = zonedDate.getMinutes();
  const seconds = zonedDate.getSeconds();
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
  const secondAngle = (seconds / 60) * 360;
  const cityLabel = (
    clockConfig.cityLabel?.trim() || inferCityLabel(clockConfig.timezone)
  ).toUpperCase();

  const digitalTime = zonedDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <MacOSDashboardSurface>
      <div className="relative z-[1] flex h-full w-full items-center justify-center px-1 py-1.5">
        <svg
          viewBox="0 0 170 170"
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full max-h-[170px] max-w-[170px]"
        >
          <defs>
            <radialGradient id={`faceGrad-${id}`} cx="50%" cy="38%" r="58%">
              <stop offset="0%" stopColor={isDark ? '#3a3a3a' : '#f8f8f8'} />
              <stop offset="100%" stopColor={isDark ? '#1a1a1a' : '#dddddd'} />
            </radialGradient>
            <filter
              id={`clockShadow-${id}`}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#000"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {showDigital ? (
            <text
              x="85"
              y="15"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="rgba(255,255,255,0.7)"
              style={{ fontFamily: MACOS_UI_FONT }}
            >
              {digitalTime}
            </text>
          ) : null}

          <circle
            cx="85"
            cy="85"
            r="55"
            fill={`url(#faceGrad-${id})`}
            stroke="none"
            strokeWidth="0"
            filter={`url(#clockShadow-${id})`}
          />

          {Array.from({ length: 12 }, (_, index) => {
            const label = index === 0 ? 12 : index;
            const angle = ((label * 30 - 90) * Math.PI) / 180;
            const radius = 40;
            return (
              <text
                key={label}
                x={85 + radius * Math.cos(angle)}
                y={85 + radius * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="700"
                fill={isDark ? 'rgba(255,255,255,0.9)' : '#333333'}
                style={{ fontFamily: MACOS_UI_FONT }}
              >
                {label}
              </text>
            );
          })}

          <polygon
            points={handPolygon(85, 85, hourAngle, 28, 3.5, 5)}
            fill={isDark ? '#dddddd' : '#222222'}
          />
          <polygon
            points={handPolygon(85, 85, minuteAngle, 40, 2.5, 5)}
            fill={isDark ? '#dddddd' : '#222222'}
          />
          {showSeconds ? (
            <line
              x1={85 - 10 * Math.cos(((secondAngle - 90) * Math.PI) / 180)}
              y1={85 - 10 * Math.sin(((secondAngle - 90) * Math.PI) / 180)}
              x2={85 + 46 * Math.cos(((secondAngle - 90) * Math.PI) / 180)}
              y2={85 + 46 * Math.sin(((secondAngle - 90) * Math.PI) / 180)}
              stroke="#D95030"
              strokeWidth="1"
              strokeLinecap="round"
            />
          ) : null}
          <circle cx="85" cy="85" r="6" fill="#D95030" />
          <circle cx="85" cy="85" r="2.5" fill="#ffffff" />

          <text
            x="85"
            y="160"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="rgba(255,255,255,0.8)"
            style={{ fontFamily: MACOS_UI_FONT }}
          >
            {cityLabel}
          </text>
        </svg>
      </div>
    </MacOSDashboardSurface>
  );
}

registerWidget({
  type: 'macos-clock',
  name: 'Dashboard Clock',
  description: 'Classic dashboard analog clock',
  icon: 'clock',
  minW: 2,
  minH: 2,
  defaultW: 2,
  defaultH: 2,
  component: MacOSClock,
  OptionsComponent: MacOSClockOptions,
  tags: ['retro', 'time'],
  defaultProps: {
    timezone: '',
    cityLabel: '',
    showSeconds: true,
    showDigital: true,
  },
});
