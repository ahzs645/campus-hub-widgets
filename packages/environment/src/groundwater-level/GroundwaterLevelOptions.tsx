'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

/** Common Prince George / BC observation wells for quick selection. */
const WELL_PRESETS = [
  { value: 'OW378', label: 'OW378 — Prince George' },
  { value: 'OW381', label: 'OW381 — Prince George' },
  { value: 'OW217', label: 'OW217 — Prince George' },
  { value: 'OW336', label: 'OW336 — Quesnel' },
  { value: 'OW276', label: 'OW276 — Williams Lake' },
  { value: 'OW309', label: 'OW309 — Kamloops' },
  { value: 'OW354', label: 'OW354 — Kelowna' },
  { value: 'OW302', label: 'OW302 — Nanaimo' },
  { value: 'custom', label: 'Custom Well ID…' },
];

/** Earlier versions saved this field as `dataSet`, which the widget never read. */
function readDatasetId(data: Record<string, unknown> | undefined): string {
  const value = data?.datasetId ?? data?.dataSet;
  return value == null ? '' : String(value);
}

interface GwOptionsData {
  locationId: string;
  datasetId: string;
  displayMode: 'current' | 'history';
  refreshInterval: number;
  useCorsProxy: boolean;
}

export default function GroundwaterLevelOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<GwOptionsData>({
    locationId: (data?.locationId as string) ?? 'OW378',
    datasetId: readDatasetId(data),
    displayMode: (data?.displayMode as 'current' | 'history') ?? 'current',
    refreshInterval: (data?.refreshInterval as number) ?? 30,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  });

  const [presetValue, setPresetValue] = useState(() => {
    const loc = (data?.locationId as string) ?? 'OW378';
    return WELL_PRESETS.some((p) => p.value === loc) ? loc : 'custom';
  });

  useEffect(() => {
    if (data) {
      const loc = (data.locationId as string) ?? 'OW378';
      setState({
        locationId: loc,
        datasetId: readDatasetId(data),
        displayMode: (data.displayMode as 'current' | 'history') ?? 'current',
        refreshInterval: (data.refreshInterval as number) ?? 30,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
      });
      setPresetValue(WELL_PRESETS.some((p) => p.value === loc) ? loc : 'custom');
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange({ ...data, ...newState });
  };

  const handlePreset = (_name: string, value: string) => {
    setPresetValue(value);
    if (value !== 'custom') {
      const newState = { ...state, locationId: value };
      setState(newState);
      onChange({ ...data, ...newState });
    }
  };

  const isCustom = presetValue === 'custom';

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">
          Observation Well
        </h3>

        <FormSelect
          label="Well Location"
          name="wellPreset"
          value={presetValue}
          options={WELL_PRESETS}
          onChange={handlePreset}
        />

        {isCustom && (
          <FormInput
            label="Custom Well ID"
            name="locationId"
            type="text"
            value={state.locationId}
            placeholder="OW378"
            onChange={handleChange}
          />
        )}

        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          BC observation well identifier. Find wells at the{' '}
          <span className="underline">BC Groundwater Level Data Interactive Map</span>.
          Data is fetched from the AQUARIUS platform via CORS proxy.
        </div>

        <FormInput
          label="Dataset ID"
          name="datasetId"
          type="text"
          value={state.datasetId}
          placeholder="e.g. 11130 (auto for OW378)"
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          The numeric AQUARIUS WebPortal dataset ID of the well's groundwater
          level (SGWL) series — the number in the dataset's WebPortal URL.
          Required for every well except OW378, whose ID is built in.
        </div>
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">
          Display
        </h3>

        <FormSelect
          label="Display Mode"
          name="displayMode"
          value={state.displayMode}
          options={[
            { value: 'current', label: 'Current Level' },
            { value: 'history', label: '7-Day History Chart' },
          ]}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">
          Settings
        </h3>

        <FormInput
          label="Refresh Interval (minutes)"
          name="refreshInterval"
          type="number"
          value={state.refreshInterval}
          min={10}
          max={120}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </div>

    </div>
  );
}

