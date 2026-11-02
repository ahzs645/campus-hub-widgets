'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, useLoopingAutoScroll } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, fetchJsonWithCache } from '@firstform/campus-hub-widget-sdk';
import { AppIcon, ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import { SourceUnavailable } from '@firstform/campus-hub-widgets-shared';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  allDay: boolean;
}

interface GoogleCalendarConfig {
  calendarId?: string;
  apiKey?: string;
  maxEvents?: number;
  refreshInterval?: number;
  showLocation?: boolean;
  daysAhead?: number;
  title?: string;
}

interface GoogleEventItem {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface GoogleCalendarResponse {
  items?: GoogleEventItem[];
  summary?: string;
}

const DEMO_EVENTS: CalendarEvent[] = [
  { title: 'CS 301 — Data Structures', start: new Date(new Date().setHours(9, 0)), end: new Date(new Date().setHours(10, 30)), location: 'Room 204, Science Bldg', allDay: false },
  { title: 'Study Group — Linear Algebra', start: new Date(new Date().setHours(11, 0)), end: new Date(new Date().setHours(12, 0)), location: 'Library Room 3B', allDay: false },
  { title: 'Career Fair', start: new Date(new Date().setHours(13, 0)), end: new Date(new Date().setHours(16, 0)), location: 'Student Center Atrium', allDay: false },
  { title: 'Intramural Soccer', start: new Date(new Date().setHours(17, 0)), end: new Date(new Date().setHours(18, 30)), location: 'South Field', allDay: false },
  { title: 'Spring Break', start: new Date(Date.now() + 86400000 * 3), end: new Date(Date.now() + 86400000 * 10), allDay: true, location: undefined },
];

/**
 * Google returns all-day events as date-only strings ('YYYY-MM-DD'). `new Date()`
 * would read those as UTC midnight, i.e. the previous day west of UTC, so they
 * are parsed as local calendar dates instead. (All-day end dates are exclusive.)
 */
function parseGoogleDate(value: { dateTime?: string; date?: string } | undefined): Date {
  if (value?.dateTime) return new Date(value.dateTime);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.date ?? '');
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(value?.date ?? '');
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function eventProgress(event: CalendarEvent): number | null {
  if (event.allDay) return null;
  const now = Date.now();
  if (now < event.start.getTime()) return null;
  if (now > event.end.getTime()) return 1;
  return (now - event.start.getTime()) / (event.end.getTime() - event.start.getTime());
}

export default function GoogleCalendar({ config, theme }: WidgetComponentProps) {
  const calConfig = config as GoogleCalendarConfig | undefined;
  const calendarId = calConfig?.calendarId?.trim() || '';
  const apiKey = calConfig?.apiKey?.trim() || '';
  const maxEvents = calConfig?.maxEvents ?? 10;
  const refreshInterval = calConfig?.refreshInterval ?? 15;
  const showLocation = calConfig?.showLocation ?? true;
  const daysAhead = calConfig?.daysAhead ?? 7;
  const customTitle = calConfig?.title?.trim() || '';

  // Both a calendar ID and an API key are needed to fetch; until then the
  // widget is in (badged) demo mode.
  const isDemo = !calendarId || !apiKey;
  const sourceKey = `${calendarId}|${apiKey}|${daysAhead}|${maxEvents}`;

  // Last-good live events, keyed by the source they came from. A configured
  // calendar starts empty (loading), never with the demo events.
  const [live, setLive] = useState<{ key: string; events: CalendarEvent[]; summary?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (isDemo) {
      setError(null);
      return;
    }
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const timeMax = futureDate.toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${encodeURIComponent(apiKey)}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxEvents}&singleEvents=true&orderBy=startTime`;
      const { data } = await fetchJsonWithCache<GoogleCalendarResponse>(url, {
        cacheKey: buildCacheKey('gcal', `${calendarId}:${daysAhead}:${maxEvents}`),
        ttlMs: refreshInterval * 60 * 1000,
      });

      const parsed: CalendarEvent[] = (data?.items ?? []).map((item) => {
        const allDay = !item.start?.dateTime;
        const start = parseGoogleDate(item.start);
        const end = parseGoogleDate(item.end);
        return {
          title: item.summary ?? 'Untitled Event',
          start,
          end,
          location: item.location,
          allDay,
        };
      });

      setLive({ key: sourceKey, events: parsed, summary: data?.summary });
      setError(null);
    } catch (err) {
      // Keep any last-good live events; never substitute the demo events.
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    }
  }, [isDemo, calendarId, apiKey, maxEvents, refreshInterval, daysAhead, sourceKey]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents, refreshInterval]);

  // Update current time for progress bars
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // demo → sample events (badged); live → last-good events from this calendar;
  // unavailable → the configured calendar failed with nothing good to show.
  const liveForSource = !isDemo && live?.key === sourceKey ? live : null;
  const events: CalendarEvent[] | null = isDemo ? DEMO_EVENTS : liveForSource?.events ?? null;
  const calTitle = customTitle || (isDemo ? 'Campus Calendar' : liveForSource?.summary || 'Calendar');
  const isUnavailable = !isDemo && events === null && error !== null;
  const isLoading = !isDemo && events === null && error === null;

  // Group events by date
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events ?? []) {
    const key = event.start.toDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(event);
  }
  const eventsRef = useLoopingAutoScroll<HTMLDivElement>([
    events,
    showLocation,
    calTitle,
  ]);

  return (
    <ThemedContainer
      theme={theme}
      color="primary"
      opacity="10"
      className="flex min-h-0"
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${theme.accent}20` }}>
          <span style={{ color: theme.accent }}><AppIcon name="calendarRange" className="w-5 h-5" /></span>
          <span className="text-lg font-semibold text-white truncate">{calTitle}</span>
          {isDemo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 ml-auto">Demo</span>
          )}
        </div>

        {/* Refresh failed but last-good events are still shown */}
        {error && events !== null && (
          <div className="px-5 py-3 text-sm text-red-400 shrink-0 truncate">{error}</div>
        )}

        {/* Events */}
        <div
          ref={eventsRef}
          data-layout-diagnostic-ignore="true"
          className="flex-1 overflow-y-auto overscroll-none px-5 py-3 scrollbar-hide"
          style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 18px), transparent)' }}
        >
          {isUnavailable ? (
            <SourceUnavailable label="Calendar" detail={error} />
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center text-center text-sm font-medium text-white/60">
              Loading events…
            </div>
          ) : events && events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm font-medium text-white/60">
              No events available
            </div>
          ) : Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="mb-4">
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: theme.accent }}
              >
                {formatDateHeader(dayEvents[0].start)}
              </div>
              {dayEvents.map((event, i) => {
                const progress = eventProgress(event);
                const isPast = progress === 1;
                const isActive = progress !== null && progress < 1;

                return (
                  <div
                    key={`${event.title}-${i}`}
                    className="mb-2 rounded-lg px-3 py-2.5 relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? `${theme.accent}20` : `${theme.accent}08`,
                      opacity: isPast ? 0.5 : 1,
                    }}
                  >
                    {/* Progress bar for active events */}
                    {isActive && (
                      <div
                        className="absolute top-0 left-0 h-full opacity-10"
                        style={{
                          width: `${(progress ?? 0) * 100}%`,
                          backgroundColor: theme.accent,
                        }}
                      />
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                            style={{ backgroundColor: theme.accent }}
                          />
                        )}
                        <span className="text-sm font-medium text-white leading-snug">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        {event.allDay ? (
                          <span>All day</span>
                        ) : (
                          <span>{formatTime(event.start)} – {formatTime(event.end)}</span>
                        )}
                        {showLocation && event.location && (
                          <span className="truncate">{event.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ThemedContainer>
  );
}
