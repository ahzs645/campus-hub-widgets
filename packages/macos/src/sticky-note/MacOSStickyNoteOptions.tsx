'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  OptionsPanel,
  OptionsSection,
  useWidgetOptionsSurface,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

const COLOR_OPTIONS = [
  { value: '#fff8a6', label: 'Classic Yellow' },
  { value: '#ffc6d8', label: 'Pink' },
  { value: '#c7dcff', label: 'Blue' },
  { value: '#c9f5be', label: 'Green' },
  { value: '#e0d0ff', label: 'Lavender' },
];

interface StickyNoteOptionsState {
  title: string;
  text: string;
  color: string;
}

export default function MacOSStickyNoteOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const surface = useWidgetOptionsSurface();
  const [state, setState] = useState<StickyNoteOptionsState>({
    title: (data.title as string) ?? 'Note',
    text: (data.text as string) ?? 'Add a reminder…',
    color: (data.color as string) ?? '#fff8a6',
  });

  useEffect(() => {
    setState({
      title: (data.title as string) ?? 'Note',
      text: (data.text as string) ?? 'Add a reminder…',
      color: (data.color as string) ?? '#fff8a6',
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Sticky note">
        <FormInput
          label="Title"
          name="title"
          value={state.title}
          onChange={handleChange}
        />
        <FormSelect
          label="Paper color"
          name="color"
          value={state.color}
          onChange={handleChange}
          options={COLOR_OPTIONS}
        />
        {surface !== 'gallery' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">
              Note text
            </label>
            <textarea
              className="w-full rounded-lg bg-[var(--ui-input-bg)] px-3 py-2 text-[var(--ui-text)] outline-none"
              style={{ border: '1px solid var(--ui-input-border)', minHeight: 120 }}
              value={state.text}
              onChange={(event) => handleChange('text', event.target.value)}
            />
          </div>
        )}
      </OptionsSection>
    </OptionsPanel>
  );
}
