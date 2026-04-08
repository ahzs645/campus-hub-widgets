'use client';
import { useState, useEffect } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
  useWidgetOptionsSurface,
} from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface TableData {
  source: 'url' | 'manual';
  csvUrl: string;
  manualData: string;
  title: string;
  headerStyle: 'accent' | 'subtle' | 'none';
  striped: boolean;
  refreshInterval: number;
  useCorsProxy: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
}

export default function SimpleTableOptions({ data, onChange }: WidgetOptionsProps) {
  const surface = useWidgetOptionsSurface();
  const [state, setState] = useState<TableData>({
    source: (data?.source as 'url' | 'manual') ?? 'manual',
    csvUrl: (data?.csvUrl as string) ?? '',
    manualData: (data?.manualData as string) ?? '',
    title: (data?.title as string) ?? '',
    headerStyle: (data?.headerStyle as 'accent' | 'subtle' | 'none') ?? 'accent',
    striped: (data?.striped as boolean) ?? true,
    refreshInterval: (data?.refreshInterval as number) ?? 30,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
    autoScroll: (data?.autoScroll as boolean) ?? true,
    scrollSpeed: (data?.scrollSpeed as number) ?? 40,
  });

  useEffect(() => {
    if (data) {
      setState({
        source: (data.source as 'url' | 'manual') ?? 'manual',
        csvUrl: (data.csvUrl as string) ?? '',
        manualData: (data.manualData as string) ?? '',
        title: (data.title as string) ?? '',
        headerStyle: (data.headerStyle as 'accent' | 'subtle' | 'none') ?? 'accent',
        striped: (data.striped as boolean) ?? true,
        refreshInterval: (data.refreshInterval as number) ?? 30,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
        autoScroll: (data.autoScroll as boolean) ?? true,
        scrollSpeed: (data.scrollSpeed as number) ?? 40,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <OptionsPanel>
      {/* Data Source */}
      {surface !== 'gallery' && (
        <OptionsSection title="Data Source">

          <FormSelect
            label="Source"
            name="source"
            value={state.source}
            options={[
              { value: 'manual', label: 'Manual Entry' },
              { value: 'url', label: 'CSV URL' },
            ]}
            onChange={handleChange}
          />

          {state.source === 'url' ? (
            <>
              <FormInput
                label="CSV URL"
                name="csvUrl"
                type="text"
                value={state.csvUrl}
                placeholder="https://example.com/data.csv"
                onChange={handleChange}
              />
              <div className="text-sm text-[var(--ui-text-muted)]">
                Point to a publicly accessible CSV file. The first row is used as column headers.
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Table Data (CSV format)</label>
                <textarea
                  value={state.manualData}
                  onChange={(e) => handleChange('manualData', e.target.value)}
                  placeholder={'Room,Status,Hours\nLibrary 3A,Available,8am – 10pm\nStudy Room,Occupied,9am – 9pm'}
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--ui-input-bg)] text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:ring-2 outline-none transition-colors font-mono text-sm"
                  style={{ border: '1px solid var(--ui-input-border)' }}
                />
              </div>
              <div className="text-sm text-[var(--ui-text-muted)]">
                Enter data in CSV format. First row becomes column headers. Use commas to separate columns.
              </div>
            </>
          )}

          <FormInput
            label="Table Title (optional)"
            name="title"
            type="text"
            value={state.title}
            placeholder="No title"
            onChange={handleChange}
          />
        </OptionsSection>
      )}

      {/* Appearance */}
      <OptionsSection title="Appearance" divider>

        <FormSelect
          label="Header Style"
          name="headerStyle"
          value={state.headerStyle}
          options={[
            { value: 'accent', label: 'Accent (bold header bar)' },
            { value: 'subtle', label: 'Subtle (light background)' },
            { value: 'none', label: 'No header styling' },
          ]}
          onChange={handleChange}
        />

        <FormSwitch
          label="Striped Rows"
          name="striped"
          checked={state.striped}
          onChange={handleChange}
        />

        <FormSwitch
          label="Auto-scroll Overflow"
          name="autoScroll"
          checked={state.autoScroll}
          onChange={handleChange}
        />

        <FormInput
          label="Scroll Speed"
          name="scrollSpeed"
          type="number"
          value={state.scrollSpeed}
          min={10}
          max={120}
          onChange={handleChange}
        />
        <div className="text-sm text-[var(--ui-text-muted)]">
          Higher = slower scrolling. The table only loops when the rows exceed the available height.
        </div>
      </OptionsSection>

      {/* Refresh (URL source only) */}
      {surface !== 'gallery' && state.source === 'url' && (
        <OptionsSection title="Refresh" divider>

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

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
        </OptionsSection>
      )}
    </OptionsPanel>
  );
}
