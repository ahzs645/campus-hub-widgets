'use client';
import { useState, useEffect } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
} from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

type DisplayMode = 'scroll' | 'ticker' | 'paginate';

interface JobBoardData {
  label: string;
  maxItems: number;
  displayMode: DisplayMode;
  rotationSeconds: number;
  speed: number;
  apiUrl: string;
  sourceType: 'json' | 'rss';
  cacheTtlSeconds: number;
  qrEnabled: boolean;
  qrUrl: string;
  qrLabel: string;
  useCorsProxy: boolean;
}

const SOURCE_TYPES = [
  { value: 'json', label: 'JSON API' },
  { value: 'rss', label: 'RSS Feed' },
];

const DISPLAY_MODES = [
  { value: 'scroll', label: 'Auto-scroll (continuous)' },
  { value: 'ticker', label: 'Ticker (one at a time)' },
  { value: 'paginate', label: 'Paginate (auto-fit)' },
];

const TYPE_LEGEND = [
  { type: 'Work Study', color: '#7c3aed' },
  { type: 'Part Time', color: '#0891b2' },
  { type: 'Full Time', color: '#059669' },
  { type: 'Volunteer', color: '#d97706' },
  { type: 'Co-op', color: '#2563eb' },
];

export default function JobBoardOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<JobBoardData>({
    label: (data?.label as string) ?? 'Campus Jobs',
    maxItems: (data?.maxItems as number) ?? 10,
    displayMode: (data?.displayMode as DisplayMode) ?? 'scroll',
    rotationSeconds: (data?.rotationSeconds as number) ?? 5,
    speed: (data?.speed as number) ?? 35,
    apiUrl: (data?.apiUrl as string) ?? '',
    sourceType: (data?.sourceType as 'json' | 'rss') ?? 'json',
    cacheTtlSeconds: (data?.cacheTtlSeconds as number) ?? 120,
    qrEnabled: (data?.qrEnabled as boolean) ?? false,
    qrUrl: (data?.qrUrl as string) ?? '',
    qrLabel: (data?.qrLabel as string) ?? 'Scan to apply',
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        label: (data.label as string) ?? 'Campus Jobs',
        maxItems: (data.maxItems as number) ?? 10,
        displayMode: (data.displayMode as DisplayMode) ?? 'scroll',
        rotationSeconds: (data.rotationSeconds as number) ?? 5,
        speed: (data.speed as number) ?? 35,
        apiUrl: (data.apiUrl as string) ?? '',
        sourceType: (data.sourceType as 'json' | 'rss') ?? 'json',
        cacheTtlSeconds: (data.cacheTtlSeconds as number) ?? 120,
        qrEnabled: (data.qrEnabled as boolean) ?? false,
        qrUrl: (data.qrUrl as string) ?? '',
        qrLabel: (data.qrLabel as string) ?? 'Scan to apply',
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
    <OptionsPanel>
      {/* Display Settings */}
      <OptionsSection title="Display Settings">
        <FormInput
          label="Widget Title"
          name="label"
          type="text"
          value={state.label}
          placeholder="Campus Jobs"
          onChange={handleChange}
        />

        <FormInput
          label="Maximum Items"
          name="maxItems"
          type="number"
          value={state.maxItems}
          min={1}
          max={20}
          onChange={handleChange}
        />

        <FormSelect
          label="Display Mode"
          name="displayMode"
          value={state.displayMode}
          options={DISPLAY_MODES}
          onChange={handleChange}
        />

        {state.displayMode === 'scroll' && (
          <>
            <FormInput
              label="Scroll Speed (seconds per loop)"
              name="speed"
              type="number"
              value={state.speed}
              min={10}
              max={120}
              onChange={handleChange}
            />
            <div className="text-xs text-[var(--ui-text-muted)]">
              Lower = faster. Jobs scroll continuously in a seamless loop.
            </div>
          </>
        )}

        {state.displayMode !== 'scroll' && (
          <>
            <FormInput
              label="Rotation Speed (seconds)"
              name="rotationSeconds"
              type="number"
              value={state.rotationSeconds}
              min={2}
              max={30}
              onChange={handleChange}
            />
            {state.displayMode === 'paginate' && (
              <div className="text-xs text-[var(--ui-text-muted)]">
                Items per page adjusts automatically based on widget height.
              </div>
            )}
          </>
        )}
      </OptionsSection>

      {/* Data Source */}
      <OptionsSection title="Data Source" divider>
        <FormSelect
          label="Source Type"
          name="sourceType"
          value={state.sourceType}
          options={SOURCE_TYPES}
          onChange={handleChange}
        />

        <FormInput
          label="API URL (optional)"
          name="apiUrl"
          type="url"
          value={state.apiUrl}
          placeholder="https://example.com/api/jobs.json"
          onChange={handleChange}
        />

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />

        <FormInput
          label="Cache TTL (seconds)"
          name="cacheTtlSeconds"
          type="number"
          value={state.cacheTtlSeconds}
          min={30}
          max={3600}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Leave empty to use demo data.
          {state.sourceType === 'json' && (
            <code className="block mt-2 p-2 bg-[var(--ui-item-bg)] rounded text-xs">
              {`[{ "title": "...", "department": "...", "type": "work-study" }]`}
            </code>
          )}
          {state.sourceType === 'rss' && (
            <div className="mt-2 text-xs">
              RSS items are mapped using item title; first category becomes department, second becomes type.
            </div>
          )}
        </div>
      </OptionsSection>

      {/* QR Code */}
      <OptionsSection title="QR Code" divider>
        <FormSwitch
          label="Show QR Code"
          name="qrEnabled"
          checked={state.qrEnabled}
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)]">
          When on, a QR code panel appears beside the job listings so viewers can scan to open a link.
        </div>

        {state.qrEnabled && (
          <>
            <FormInput
              label="QR Code URL"
              name="qrUrl"
              type="text"
              value={state.qrUrl}
              placeholder="https://careers.example.edu/jobs"
              onChange={handleChange}
            />

            <FormInput
              label="QR Label"
              name="qrLabel"
              type="text"
              value={state.qrLabel}
              placeholder="Scan to apply"
              onChange={handleChange}
            />
          </>
        )}
      </OptionsSection>

      {/* Job type legend */}
      <OptionsSection title="Job Type Colors" divider>
        <div className="bg-[var(--ui-item-bg)] rounded-xl p-4 flex flex-wrap gap-2 justify-center">
          {TYPE_LEGEND.map((t) => (
            <span
              key={t.type}
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.type}
            </span>
          ))}
        </div>
      </OptionsSection>

    </OptionsPanel>
  );
}
