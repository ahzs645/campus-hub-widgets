'use client';
import { useState, useEffect } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
  OptionsPreview,
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
        <FormInput
          label="QR Code URL"
          name="qrUrl"
          type="text"
          value={state.qrUrl}
          placeholder="https://careers.example.edu/jobs"
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)]">
          URL encoded in the QR code, shown as a panel beside the job listings. Leave blank to hide the QR code.
        </div>

        <FormInput
          label="QR Label"
          name="qrLabel"
          type="text"
          value={state.qrLabel}
          placeholder="Scan to apply"
          onChange={handleChange}
        />
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

      {/* Preview */}
      <OptionsPreview>
        <div className="flex items-center gap-2 text-[var(--color-accent)] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="font-bold">{state.label}</span>
          {state.displayMode !== 'scroll' && (
            <span className="text-white/40 text-xs ml-auto">
              {state.displayMode === 'ticker' ? 'auto-cycles' : 'auto-fit pages'}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {[
            { title: 'Library Circulation Desk', type: 'Work Study', color: '#7c3aed', dept: 'Library' },
            { title: 'Research Assistant', type: 'Part Time', color: '#0891b2', dept: 'Biology' },
            { title: 'Student Ambassador', type: 'Volunteer', color: '#d97706', dept: 'Student Affairs' },
          ]
            .slice(0, state.displayMode === 'ticker' ? 1 : Math.min(3, state.maxItems))
            .map((job, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-white/10 border-l-2"
                style={{ borderLeftColor: job.color }}
              >
                <div className="text-white text-sm font-medium">{job.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
                    style={{ backgroundColor: job.color }}
                  >
                    {job.type}
                  </span>
                  <span className="text-white/60 text-xs">{job.dept}</span>
                </div>
              </div>
            ))}
        </div>
        {state.displayMode !== 'scroll' && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {Array.from({ length: state.displayMode === 'ticker' ? 3 : 2 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i === 0 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        )}
      </OptionsPreview>
    </OptionsPanel>
  );
}
