'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { useFitScale, AppIcon, ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchTextWithCache } from '@firstform/campus-hub-widget-sdk';
import { parseICal } from '@firstform/campus-hub-widget-sdk';
import CalendarOptions from './CalendarOptions';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  allDay: boolean;
}

interface CalendarConfig {
  calendarUrl?: string;
  sourceFormat?: 'ical' | 'google-public';
  maxEvents?: number;
  refreshInterval?: number;
  showLocation?: boolean;
  daysAhead?: number;
  title?: string;
  useCorsProxy?: boolean;
  galleryDemo?: boolean;
}

const DEMO_EVENTS: CalendarEvent[] = [
  { title: 'Team Standup', start: new Date(new Date().setHours(9, 0)), end: new Date(new Date().setHours(9, 30)), location: 'Meeting Room A', allDay: false },
  { title: 'Workshop: Digital Signage 101', start: new Date(new Date().setHours(10, 0)), end: new Date(new Date().setHours(11, 30)), location: 'Training Lab', allDay: false },
  { title: 'Lunch & Learn', start: new Date(new Date().setHours(12, 0)), end: new Date(new Date().setHours(13, 0)), location: 'Cafeteria', allDay: false },
  { title: 'Q2 Planning', start: new Date(new Date().setHours(14, 0)), end: new Date(new Date().setHours(16, 0)), location: 'Board Room', allDay: false },
  { title: 'Holiday - Campus Closed', start: new Date(Date.now() + 86400000 * 2), end: new Date(Date.now() + 86400000 * 2), allDay: true, location: undefined },
];

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

function eventProgress(event: CalendarEvent): number | null {
  if (event.allDay) return null;
  const now = Date.now();
  if (now < event.start.getTime()) return null;
  if (now > event.end.getTime()) return 1;
  return (now - event.start.getTime()) / (event.end.getTime() - event.start.getTime());
}

/**
 * Convert a Google Calendar public URL to an iCal export URL.
 * Input: https://calendar.google.com/calendar/u/0?cid=BASE64_ID
 * or: a plain calendar ID like abc@group.calendar.google.com
 */
function resolveCalendarUrl(url: string, format: string): string {
  if (format === 'google-public') {
    // If it's already an ics URL, use as-is
    if (url.includes('/ical/') || url.endsWith('.ics')) return url;

    // Extract calendar ID from Google Calendar URL
    try {
      const u = new URL(url);
      const cid = u.searchParams.get('cid');
      if (cid) {
        // cid is base64-encoded calendar ID
        const calId = atob(cid);
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`;
      }
    } catch {
      // Not a URL — treat as a calendar ID directly
    }

    // Treat as plain calendar ID
    if (url.includes('@')) {
      return `https://calendar.google.com/calendar/ical/${encodeURIComponent(url)}/public/basic.ics`;
    }
  }

  return url;
}

export default function CalendarWidget({ config, theme }: WidgetComponentProps) {
  const c = config as CalendarConfig | undefined;
  const calendarUrl = c?.calendarUrl?.trim() || '';
  const sourceFormat = c?.sourceFormat ?? 'ical';
  const maxEvents = c?.maxEvents ?? 10;
  const refreshInterval = c?.refreshInterval ?? 15;
  const showLocation = c?.showLocation ?? true;
  const daysAhead = c?.daysAhead ?? 7;
  const customTitle = c?.title?.trim() || '';
  const useCorsProxy = c?.useCorsProxy ?? true;
  const galleryDemo = c?.galleryDemo ?? false;

  const [events, setEvents] = useState<CalendarEvent[]>(DEMO_EVENTS);
  const [error, setError] = useState<string | null>(null);
  const { containerRef, scale } = useFitScale(410, 600);

  const fetchEvents = useCallback(async () => {
    if (!calendarUrl || galleryDemo) {
      setEvents(DEMO_EVENTS);
      setError(null);
      return;
    }
    try {
      setError(null);
      const resolvedUrl = resolveCalendarUrl(calendarUrl, sourceFormat);
      const fetchUrl = useCorsProxy ? buildProxyUrl(resolvedUrl) : resolvedUrl;

      const { text } = await fetchTextWithCache(fetchUrl, {
        cacheKey: buildCacheKey('calendar', calendarUrl),
        ttlMs: refreshInterval * 60 * 1000,
      });

      const parsed = parseICal(text);

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const mapped: CalendarEvent[] = parsed
        .filter((e) => e.start && e.start >= now && e.start <= futureDate)
        .map((e) => ({
          title: e.summary,
          start: e.start!,
          end: e.end ?? e.start!,
          location: e.location,
          allDay: e.startRaw?.trim().length === 8,
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, maxEvents);

      setEvents(mapped.length > 0 ? mapped : DEMO_EVENTS);
      setError(null);
    } catch (err) {
      console.warn('Failed to load calendar:', err);
      setEvents((current) => (current.length > 0 ? current : DEMO_EVENTS));
      setError(null);
    }
  }, [calendarUrl, galleryDemo, sourceFormat, refreshInterval, daysAhead, maxEvents, useCorsProxy]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents, refreshInterval]);

  // Tick for progress bars
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Group by date
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = event.start.toDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(event);
  }

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="10"
      className="flex items-center justify-center"
    >
      <div
        style={{ width: 410, height: 600, transform: `scale(${scale})`, transformOrigin: 'center center' }}
        className="flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${theme.accent}20` }}>
          <span style={{ color: theme.accent }}><AppIcon name="calendarRange" className="w-5 h-5" /></span>
          <span className="text-lg font-semibold text-white truncate">{customTitle || 'Calendar'}</span>
          {(!calendarUrl || galleryDemo) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 ml-auto">Demo</span>
          )}
        </div>

        {error && events.length === 0 && <div className="px-5 py-3 text-sm text-red-400 shrink-0">{error}</div>}

        {/* Events */}
        <div className="flex-1 overflow-hidden px-5 py-3">
          {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
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
                    {isActive && (
                      <div
                        className="absolute top-0 left-0 h-full opacity-10"
                        style={{ width: `${(progress ?? 0) * 100}%`, backgroundColor: theme.accent }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: theme.accent }} />
                        )}
                        <span className="text-sm font-medium text-white leading-snug">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        {event.allDay ? <span>All day</span> : <span>{formatTime(event.start)} – {formatTime(event.end)}</span>}
                        {showLocation && event.location && <span className="truncate">{event.location}</span>}
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

registerWidget({
  type: 'calendar',
  name: 'Calendar',
  description: 'Show upcoming events from iCal, Google Calendar, or any calendar URL',
  icon: 'calendarRange',
  minW: 2,
  minH: 3,
  defaultW: 3,
  defaultH: 4,
  component: CalendarWidget,
  OptionsComponent: CalendarOptions,
  acceptsSources: [{ propName: 'calendarUrl', types: ['calendar'] }],
  defaultProps: {
    calendarUrl: '',
    sourceFormat: 'ical',
    maxEvents: 10,
    refreshInterval: 15,
    showLocation: true,
    daysAhead: 7,
    title: '',
    useCorsProxy: true,
  },
});
