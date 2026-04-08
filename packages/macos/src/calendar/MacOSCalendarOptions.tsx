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
  });

  useEffect(() => {
    setState({
      title: (data.title as string) ?? 'Calendar',
      apiUrl: (data.apiUrl as string) ?? '',
      sourceType: ((data.sourceType as 'json' | 'ical' | 'rss') ?? 'ical'),
      maxItems: Number(data.maxItems ?? 6),
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = {
      ...state,
      [name]: name === 'maxItems' ? Number(value) : value,
    };
    setState(next);
    onChange(next);
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
      </OptionsSection>
    </OptionsPanel>
  );
}
