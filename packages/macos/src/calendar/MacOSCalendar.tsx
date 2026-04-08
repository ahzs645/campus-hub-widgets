'use client';

import { useMemo } from 'react';
import {
  registerWidget,
  useEvents,
  useFitScale,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSCalendarOptions from './MacOSCalendarOptions';

interface CalendarConfig {
  title?: string;
  apiUrl?: string;
  sourceType?: 'json' | 'ical' | 'rss';
  maxItems?: number;
}

const DEMO_EVENTS = [
  {
    id: 1,
    title: 'Campus tour',
    date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    time: '10:00 AM',
    location: 'Welcome Center',
    _sortTs: new Date().setHours(10, 0, 0, 0),
  },
  {
    id: 2,
    title: 'Student senate',
    date: new Date(Date.now() + 86400000).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    }),
    time: '2:30 PM',
    location: 'Room 214',
    _sortTs: new Date(Date.now() + 86400000).setHours(14, 30, 0, 0),
  },
  {
    id: 3,
    title: 'Film night',
    date: new Date(Date.now() + 2 * 86400000).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    }),
    time: '7:00 PM',
    location: 'Auditorium',
    _sortTs: new Date(Date.now() + 2 * 86400000).setHours(19, 0, 0, 0),
  },
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function MacOSCalendar({ config }: WidgetComponentProps) {
  const calendarConfig = (config ?? {}) as CalendarConfig;
  const { containerRef, containerWidth, containerHeight } = useFitScale(384, 288);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const events = useEvents({
    apiUrl: calendarConfig.apiUrl?.trim() || undefined,
    sourceType: calendarConfig.sourceType ?? 'ical',
    maxItems: calendarConfig.maxItems ?? 6,
    defaultEvents: DEMO_EVENTS,
  });

  const eventDates = useMemo(() => {
    return events
      .map((event) =>
        typeof event._sortTs === 'number' ? new Date(event._sortTs) : null,
      )
      .filter((value): value is Date => Boolean(value));
  }, [events]);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const count = eventDates.filter((eventDate) => isSameDay(eventDate, date)).length;
    return {
      date,
      inMonth: date.getMonth() === now.getMonth(),
      isToday: isSameDay(date, now),
      count,
    };
  });

  const dayHeaders = useMemo(
    () => ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    [],
  );
  const dayAbbrev = now
    .toLocaleDateString([], { weekday: 'short' })
    .slice(0, 3)
    .toUpperCase();
  const monthAbbrev = now
    .toLocaleDateString([], { month: 'short' })
    .slice(0, 3)
    .toUpperCase();
  const brown = '#A33A2A';
  const brownDark = '#7C2418';
  const brownLight = '#C4503A';
  const isCompact =
    containerWidth > 0 &&
    containerHeight > 0 &&
    (containerWidth < 340 || containerHeight < 270);
  const dayHeaderSize = isCompact ? 11 : 14;
  const dayChipSize = isCompact ? 22 : 26;
  const dayNumberSize = isCompact ? 13 : 15;
  const rowPaddingY = isCompact ? 4 : 6;

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px]"
      style={{
        background: `linear-gradient(180deg, ${brownLight} 0%, ${brown} 30%, ${brownDark} 100%)`,
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)',
      }}
    >
      {isCompact ? (
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="min-w-0">
            <div
              className="font-bold"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.72)',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                letterSpacing: '0.08em',
              }}
            >
              {dayAbbrev}
            </div>
            <div
              className="truncate font-bold leading-none"
              style={{
                fontSize: 26,
                color: '#FFF',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {monthAbbrev} {now.getDate()}
            </div>
          </div>
          <div
            className="shrink-0 rounded-full px-3 py-1"
            style={{
              background: 'rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {events.length} event{events.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 px-3 pt-3 pb-2">
          <div
            className="relative flex flex-1 flex-col items-center justify-center"
            style={{
              aspectRatio: '1',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F0EDE8 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div
              className="font-bold"
              style={{
                fontSize: 16,
                color: brown,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {dayAbbrev}
            </div>
            <div
              className="font-bold leading-tight"
              style={{
                fontSize: 24,
                color: brown,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {monthAbbrev}
            </div>
          </div>
          <div
            className="relative flex flex-1 items-center justify-center"
            style={{
              aspectRatio: '1',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F0EDE8 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div
              className="font-bold leading-none"
              style={{
                fontSize: 56,
                color: brown,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {now.getDate()}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <div
          className="grid grid-cols-7 pb-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
        >
          {dayHeaders.map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-center font-bold"
              style={{
                fontSize: dayHeaderSize,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-6">
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7"
              style={{
                borderBottom:
                  weekIndex < 5 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                <div
                  key={day.date.toISOString()}
                  className="relative flex items-center justify-center"
                  style={{
                    opacity: day.inMonth ? 1 : 0,
                    paddingTop: rowPaddingY,
                    paddingBottom: rowPaddingY,
                  }}
                >
                  <span
                    className="flex items-center justify-center leading-none"
                    style={{
                      width: dayChipSize,
                      height: dayChipSize,
                      borderRadius: 6,
                      backgroundColor: day.isToday
                        ? 'rgba(255,255,255,0.25)'
                        : 'transparent',
                      color: day.isToday
                        ? '#FFF'
                        : 'rgba(255,255,255,0.55)',
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                      fontSize: dayNumberSize,
                      fontWeight: day.isToday ? 800 : 700,
                    }}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.count > 0 ? (
                    <div
                      className="absolute flex gap-0.5"
                      style={{
                        bottom: 1,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {Array.from({ length: Math.min(day.count, 2) }, (_, dotIndex) => (
                        <span
                          key={dotIndex}
                          className="h-1 w-1 rounded-full"
                          style={{ backgroundColor: '#F0A060' }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          className="pt-1 text-center"
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            opacity: isCompact ? 0 : 1,
          }}
        >
          {events.length} event{events.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}

registerWidget({
  type: 'macos-calendar',
  name: 'macOS Calendar',
  description: 'Aqua-style month view with upcoming events',
  icon: 'calendarRange',
  minW: 3,
  minH: 3,
  defaultW: 4,
  defaultH: 3,
  component: MacOSCalendar,
  OptionsComponent: MacOSCalendarOptions,
  tags: ['retro', 'campus'],
  acceptsSources: [{
    propName: 'apiUrl',
    types: ['api', 'calendar', 'feed'],
    applySource: (source) => ({
      apiUrl: source.url,
      sourceType:
        source.sourceType === 'calendar'
          ? 'ical'
          : source.sourceType === 'feed'
            ? 'rss'
            : 'json',
    }),
  }],
  defaultProps: {
    title: 'Calendar',
    apiUrl: '',
    sourceType: 'ical',
    maxItems: 6,
  },
});
