'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface CalendarData {
  calendarUrl: string;
  sourceFormat: 'ical' | 'google-public';
  maxEvents: number;
  refreshInterval: number;
  showLocation: boolean;
  daysAhead: number;
  title: string;
  useCorsProxy: boolean;
}

export default function CalendarOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<CalendarData>({
    calendarUrl: (data?.calendarUrl as string) ?? '',
    sourceFormat: (data?.sourceFormat as 'ical' | 'google-public') ?? 'ical',
    maxEvents: (data?.maxEvents as number) ?? 10,
    refreshInterval: (data?.refreshInterval as number) ?? 15,
    showLocation: (data?.showLocation as boolean) ?? true,
    daysAhead: (data?.daysAhead as number) ?? 7,
    title: (data?.title as string) ?? '',
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        calendarUrl: (data.calendarUrl as string) ?? '',
        sourceFormat: (data.sourceFormat as 'ical' | 'google-public') ?? 'ical',
        maxEvents: (data.maxEvents as number) ?? 10,
        refreshInterval: (data.refreshInterval as number) ?? 15,
        showLocation: (data.showLocation as boolean) ?? true,
        daysAhead: (data.daysAhead as number) ?? 7,
        title: (data.title as string) ?? '',
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Source */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Calendar Source</h3>

        <FormSelect
          label="Format"
          name="sourceFormat"
          value={state.sourceFormat}
          options={[
            { value: 'ical', label: 'iCal / ICS URL' },
            { value: 'google-public', label: 'Google Calendar (public)' },
          ]}
          onChange={handleChange}
        />

        <FormInput
          label={state.sourceFormat === 'google-public' ? 'Google Calendar URL or ID' : 'Calendar URL (.ics)'}
          name="calendarUrl"
          type="url"
          value={state.calendarUrl}
          placeholder={
            state.sourceFormat === 'google-public'
              ? 'calendar-id@group.calendar.google.com'
              : 'https://example.com/calendar.ics'
          }
          onChange={handleChange}
        />

        <div className="bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-strong)] rounded-lg p-4">
          <div className="flex gap-2">
            <AppIcon name="info" className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[var(--ui-text-muted)]">
              {state.sourceFormat === 'google-public' ? (
                <>
                  <strong>Google Calendar:</strong> Make your calendar public (Settings → Access permissions → Make available to public), then paste the calendar ID (e.g. abc@group.calendar.google.com) or the share URL. No API key needed.
                </>
              ) : (
                <>
                  <strong>iCal:</strong> Paste any .ics calendar URL. Works with Outlook, Apple Calendar, Nextcloud, and any service that provides iCal feeds.
                </>
              )}
            </div>
          </div>
        </div>

        <FormInput
          label="Custom Title (optional)"
          name="title"
          type="text"
          value={state.title}
          placeholder="My Calendar"
          onChange={handleChange}
        />

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </div>

      {/* Display */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Display</h3>

        <FormSelect
          label="Max Events"
          name="maxEvents"
          value={String(state.maxEvents)}
          options={[
            { value: '5', label: '5 events' },
            { value: '10', label: '10 events' },
            { value: '15', label: '15 events' },
            { value: '20', label: '20 events' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <FormSelect
          label="Days Ahead"
          name="daysAhead"
          value={String(state.daysAhead)}
          options={[
            { value: '1', label: 'Today only' },
            { value: '3', label: '3 days' },
            { value: '7', label: '1 week' },
            { value: '14', label: '2 weeks' },
            { value: '30', label: '1 month' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <FormSwitch
          label="Show Location"
          name="showLocation"
          checked={state.showLocation}
          onChange={handleChange}
        />
      </div>

      {/* Refresh */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Refresh</h3>

        <FormSelect
          label="Auto-refresh every"
          name="refreshInterval"
          value={String(state.refreshInterval)}
          options={[
            { value: '5', label: '5 minutes' },
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />
      </div>
    </div>
  );
}
