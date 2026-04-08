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
  layoutMode?: 'auto' | 'full' | 'compact';
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  const measuredWidth = containerWidth || 384;
  const measuredHeight = containerHeight || 288;
  const layoutMode = calendarConfig.layoutMode ?? 'auto';
  const autoCompact =
    measuredWidth < 340 || measuredHeight < 270;
  const isCompact = layoutMode === 'compact' || (layoutMode !== 'full' && autoCompact);
  const isTightFull = !isCompact && (measuredWidth < 470 || measuredHeight < 310);
  const baseFullHeaderHeight = Math.round(clamp(measuredHeight * 0.46, 116, 184));
  const baseHeaderPaddingTop = Math.round(clamp(baseFullHeaderHeight * 0.08, 10, 14));
  const baseHeaderPaddingBottom = Math.round(clamp(baseFullHeaderHeight * 0.04, 4, 8));
  const tallCardHeight = Math.round(clamp((measuredWidth - 32) / 2, 92, 156));
  const useTallHeaderCards = !isCompact && measuredHeight > measuredWidth * 1.1;
  const tallHeaderPaddingTop = Math.round(clamp(tallCardHeight * 0.1, 10, 16));
  const tallHeaderPaddingBottom = Math.round(clamp(tallCardHeight * 0.06, 4, 10));
  const fullHeaderPaddingTop = useTallHeaderCards ? tallHeaderPaddingTop : baseHeaderPaddingTop;
  const fullHeaderPaddingBottom = useTallHeaderCards ? tallHeaderPaddingBottom : baseHeaderPaddingBottom;
  const fullHeaderHeight = useTallHeaderCards
    ? tallCardHeight + tallHeaderPaddingTop + tallHeaderPaddingBottom
    : baseFullHeaderHeight;
  const weekdayFontSize = useTallHeaderCards
    ? Math.round(clamp(tallCardHeight * 0.16, 13, 18))
    : Math.round(clamp(baseFullHeaderHeight * 0.11, 13, 18));
  const monthFontSize = useTallHeaderCards
    ? Math.round(clamp(tallCardHeight * 0.24, 22, 30))
    : Math.round(clamp(baseFullHeaderHeight * 0.16, 22, 28));
  const dateFontSize = useTallHeaderCards
    ? Math.round(clamp(tallCardHeight * 0.54, 46, 68))
    : Math.round(clamp(baseFullHeaderHeight * 0.38, 46, 66));
  const calendarFooterVisible = !isCompact && !isTightFull;
  const weekdayRowReserve = isCompact ? 20 : 24;
  const footerReserve = calendarFooterVisible ? 14 : 0;
  const availableRowHeight = Math.max(
    16,
    (measuredHeight - fullHeaderHeight - weekdayRowReserve - footerReserve - 8) / 6,
  );
  const dayHeaderSize = isCompact
    ? 12
    : Math.round(clamp(Math.min(measuredHeight * 0.048, availableRowHeight * 0.62), 11, 14));
  const dayChipSize = isCompact
    ? 24
    : Math.round(clamp(Math.min(measuredHeight * 0.09, availableRowHeight - 2), 16, 26));
  const rowPaddingY = isCompact
    ? 3
    : Math.round(clamp((availableRowHeight - dayChipSize) / 2, 1, 4));
  const dayNumberSize = isCompact
    ? 14
    : Math.round(clamp(dayChipSize * 0.58, 11, 15));

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[20px]"
      style={{
        background: `linear-gradient(180deg, ${brownLight} 0%, ${brown} 30%, ${brownDark} 100%)`,
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)',
      }}
    >
      {isCompact ? (
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
          <div className="min-w-0">
            <div
              className="font-bold"
              style={{
                fontSize: 11,
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
                fontSize: 24,
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
                fontSize: 9,
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
        <div
          className="flex gap-2 px-3"
          style={{
            height: fullHeaderHeight,
            paddingTop: fullHeaderPaddingTop,
            paddingBottom: fullHeaderPaddingBottom,
          }}
        >
          <div
            className="relative flex flex-1 flex-col items-center justify-center"
            style={{
              height: useTallHeaderCards ? tallCardHeight : '100%',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F0EDE8 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div
              className="font-bold"
              style={{
                fontSize: weekdayFontSize,
                color: brown,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {dayAbbrev}
            </div>
            <div
              className="font-bold leading-tight"
              style={{
                fontSize: monthFontSize,
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
              height: useTallHeaderCards ? tallCardHeight : '100%',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F0EDE8 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div
              className="font-bold leading-none"
              style={{
                fontSize: dateFontSize,
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
          className="grid grid-cols-7"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            paddingBottom: isCompact ? 4 : Math.round(clamp(measuredHeight * 0.014, 4, 8)),
          }}
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

        {calendarFooterVisible ? (
          <div
            className="pt-1 text-center"
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.45)',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            {events.length} event{events.length === 1 ? '' : 's'}
          </div>
        ) : null}
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
    layoutMode: 'auto',
  },
});
