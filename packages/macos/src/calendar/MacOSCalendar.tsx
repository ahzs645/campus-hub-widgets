'use client';

import { useMemo } from 'react';
import {
  registerWidget,
  useEvents,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSCalendarOptions from './MacOSCalendarOptions';
import { MacOSInset, MacOSPill, MacOSWidgetFrame } from '../shared/ui';

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
  const title = calendarConfig.title?.trim() || 'Calendar';
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

  return (
    <MacOSWidgetFrame
      title={title}
      subtitle={now.toLocaleDateString([], { month: 'long', year: 'numeric' })}
      toolbar={<MacOSPill>{events.length} events</MacOSPill>}
    >
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3">
        <MacOSInset className="flex min-h-0 flex-col p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`${day}-${index}`}>{day}</div>
            ))}
          </div>
          <div className="mt-2 grid flex-1 grid-cols-7 gap-1">
            {days.map((day) => (
              <div
                key={day.date.toISOString()}
                className="flex min-h-[2.3rem] flex-col rounded-[10px] border border-black/6 px-1.5 py-1 text-[11px]"
                style={{
                  background: day.isToday
                    ? 'linear-gradient(180deg, rgba(109,171,255,0.96), rgba(64,129,232,0.96))'
                    : day.inMonth
                      ? 'rgba(255,255,255,0.74)'
                      : 'rgba(0,0,0,0.04)',
                  color: day.isToday ? '#fff' : day.inMonth ? '#1a1a1a' : 'rgba(0,0,0,0.32)',
                }}
              >
                <span className="font-semibold">{day.date.getDate()}</span>
                {day.count > 0 ? (
                  <span className="mt-auto text-[9px] font-semibold opacity-75">
                    {day.count} event{day.count > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </MacOSInset>
        <MacOSInset className="macos-scroll flex min-h-0 flex-col overflow-auto p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
            Upcoming
          </div>
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-[10px] border border-black/8 bg-white/70 px-3 py-2"
              >
                <div className="text-[12px] font-semibold text-[#1c2b3b]">
                  {event.title}
                </div>
                <div className="mt-1 text-[11px] text-black/55">
                  {[event.date, event.time].filter(Boolean).join(' · ')}
                </div>
                {event.location ? (
                  <div className="mt-1 text-[11px] text-[#3f5e7a]">
                    {event.location}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </MacOSInset>
      </div>
    </MacOSWidgetFrame>
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
