'use client';
import { useState, useEffect } from 'react';
import { FormSelect, FormSwitch, FormInput, OptionsPanel, OptionsSection } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

type ClockAlignment = 'left' | 'center' | 'right';
type ClockVerticalAlignment = 'top' | 'center' | 'bottom';
type ClockStyle = 'digital' | 'analog' | 'mosaic';

interface ClockData {
  showSeconds: boolean;
  showDate: boolean;
  format24h: boolean;
  alignment: ClockAlignment;
  verticalAlignment: ClockVerticalAlignment;
  style: ClockStyle;
  customFormat: string;
}

function normalizeAlignment(value: unknown): ClockAlignment {
  if (value === 'left' || value === 'center' || value === 'right') return value;
  return 'right';
}

function normalizeVerticalAlignment(value: unknown): ClockVerticalAlignment {
  if (value === 'top' || value === 'center' || value === 'bottom') return value;
  return 'top';
}

function normalizeStyle(value: unknown): ClockStyle {
  if (value === 'digital' || value === 'analog' || value === 'mosaic') return value;
  return 'digital';
}

export default function ClockOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<ClockData>({
    showSeconds: (data?.showSeconds as boolean) ?? false,
    showDate: (data?.showDate as boolean) ?? true,
    format24h: (data?.format24h as boolean) ?? false,
    alignment: normalizeAlignment(data?.alignment),
    verticalAlignment: normalizeVerticalAlignment(data?.verticalAlignment),
    style: normalizeStyle(data?.style),
    customFormat: (data?.customFormat as string) ?? '',
  });

  useEffect(() => {
    if (data) {
      setState({
        showSeconds: (data.showSeconds as boolean) ?? false,
        showDate: (data.showDate as boolean) ?? true,
        format24h: (data.format24h as boolean) ?? false,
        alignment: normalizeAlignment(data.alignment),
        verticalAlignment: normalizeVerticalAlignment(data.verticalAlignment),
        style: normalizeStyle(data.style),
        customFormat: (data.customFormat as string) ?? '',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  const isAnalog = state.style === 'analog';
  const isMosaic = state.style === 'mosaic';

  return (
    <OptionsPanel>
      {/* Settings */}
      <OptionsSection title="Display Options">

        <FormSelect
          label="Clock Style"
          name="style"
          value={state.style}
          options={[
            { value: 'digital', label: 'Digital' },
            { value: 'analog', label: 'Analog' },
            { value: 'mosaic', label: 'Mosaic' },
          ]}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Seconds"
          name="showSeconds"
          checked={state.showSeconds}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Date"
          name="showDate"
          checked={state.showDate}
          onChange={handleChange}
        />

        {!isAnalog && !isMosaic && (
          <FormSwitch
            label="24-Hour Format"
            name="format24h"
            checked={state.format24h}
            onChange={handleChange}
          />
        )}

        {!isAnalog && !isMosaic && (
          <FormInput
            label="Custom Format (optional)"
            name="customFormat"
            type="text"
            value={state.customFormat}
            placeholder="e.g. h:mm a{br}EEEE, MMM d"
            onChange={handleChange}
          />
        )}
        {!isAnalog && !isMosaic && state.customFormat && (
          <div className="text-xs text-[var(--ui-text-muted)]">
            Use {'{br}'} for multi-line display. Overrides the standard format when set.
          </div>
        )}

        <FormSelect
          label="Alignment"
          name="alignment"
          value={state.alignment}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={handleChange}
        />

        <FormSelect
          label="Vertical Alignment"
          name="verticalAlignment"
          value={state.verticalAlignment}
          options={[
            { value: 'top', label: 'Top' },
            { value: 'center', label: 'Center' },
            { value: 'bottom', label: 'Bottom' },
          ]}
          onChange={handleChange}
        />
      </OptionsSection>

    </OptionsPanel>
  );
}
