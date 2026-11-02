'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormStepper,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface CalendarOptionsState {
  title: string;
  apiUrl: string;
  sourceType: 'json' | 'ical' | 'rss';
  maxItems: number;
  layoutMode: 'auto' | 'full' | 'compact';
}

function readLayoutMode(value: unknown): CalendarOptionsState['layoutMode'] {
  return value === 'full' || value === 'compact' ? value : 'auto';
}

export default function MacOSCalendarOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<CalendarOptionsState>({
    title: (data.title as string) ?? 'Calendar',
    apiUrl: (data.apiUrl as string) ?? '',
    sourceType: ((data.sourceType as 'json' | 'ical' | 'rss') ?? 'ical'),
    maxItems: Number(data.maxItems ?? 6),
    layoutMode: readLayoutMode(data.layoutMode),
  });

  useEffect(() => {
    setState({
      title: (data.title as string) ?? 'Calendar',
      apiUrl: (data.apiUrl as string) ?? '',
      sourceType: ((data.sourceType as 'json' | 'ical' | 'rss') ?? 'ical'),
      maxItems: Number(data.maxItems ?? 6),
      layoutMode: readLayoutMode(data.layoutMode),
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = {
      ...state,
      [name]: name === 'maxItems' ? Number(value) : value,
    };
    setState(next);
    // Spread existing data so keys this form does not edit (e.g. a linked
    // source reference) survive.
    onChange({ ...data, ...next });
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Calendar source">
        <FormInput
          label="Title"
          name="title"
          value={state.title}
          onChange={handleChange}
        />
        <FormInput
          label="Feed URL"
          name="apiUrl"
          value={state.apiUrl}
          placeholder="Leave blank for demo events"
          onChange={handleChange}
        />
        <FormSelect
          label="Source type"
          name="sourceType"
          value={state.sourceType}
          onChange={handleChange}
          options={[
            { value: 'ical', label: 'iCal / ICS' },
            { value: 'json', label: 'JSON' },
            { value: 'rss', label: 'RSS' },
          ]}
        />
        <FormStepper
          label="Upcoming events"
          name="maxItems"
          value={state.maxItems}
          min={3}
          max={12}
          step={1}
          unit=""
          onChange={handleChange}
        />
        <FormSelect
          label="Layout"
          name="layoutMode"
          value={state.layoutMode}
          onChange={handleChange}
          options={[
            { value: 'auto', label: 'Auto (compact when small)' },
            { value: 'full', label: 'Full' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}
