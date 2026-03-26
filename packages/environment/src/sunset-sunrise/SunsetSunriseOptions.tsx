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
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface SunsetSunriseData {
  latitude: number;
  longitude: number;
  locationName: string;
  timeFormat: '12h' | '24h';
  showDetails: boolean;
  refreshInterval: number;
}

export default function SunsetSunriseOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<SunsetSunriseData>({
    latitude: (data?.latitude as number) ?? 48.8566,
    longitude: (data?.longitude as number) ?? 2.3522,
    locationName: (data?.locationName as string) ?? 'Paris',
    timeFormat: (data?.timeFormat as '12h' | '24h') ?? '12h',
    showDetails: (data?.showDetails as boolean) ?? true,
    refreshInterval: (data?.refreshInterval as number) ?? 30,
  });

  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (data) {
      setState({
        latitude: (data.latitude as number) ?? 48.8566,
        longitude: (data.longitude as number) ?? 2.3522,
        locationName: (data.locationName as string) ?? 'Paris',
        timeFormat: (data.timeFormat as '12h' | '24h') ?? '12h',
        showDetails: (data.showDetails as boolean) ?? true,
        refreshInterval: (data.refreshInterval as number) ?? 30,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newState = {
          ...state,
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
          locationName: 'My Location',
        };
        setState(newState);
        onChange(newState);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      },
    );
  };

  return (
    <OptionsPanel>
      {/* Location */}
      <OptionsSection title="Location">
        <FormInput
          label="Location Name"
          name="locationName"
          type="text"
          value={state.locationName}
          placeholder="City name"
          onChange={handleChange}
        />

        <FormInput
          label="Latitude"
          name="latitude"
          type="number"
          value={String(state.latitude)}
          placeholder="48.8566"
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <FormInput
          label="Longitude"
          name="longitude"
          type="number"
          value={String(state.longitude)}
          placeholder="2.3522"
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingLocation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--ui-bg-hover)',
            color: 'var(--ui-text)',
            opacity: detectingLocation ? 0.6 : 1,
          }}
        >
          <AppIcon name="mapPin" className="w-4 h-4" />
          {detectingLocation ? 'Detecting...' : 'Use My Location'}
        </button>
      </OptionsSection>

      {/* Display */}
      <OptionsSection title="Display" divider>
        <FormSelect
          label="Time Format"
          name="timeFormat"
          value={state.timeFormat}
          options={[
            { value: '12h', label: '12-hour (AM/PM)' },
            { value: '24h', label: '24-hour' },
          ]}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Details"
          name="showDetails"
          checked={state.showDetails}
          onChange={handleChange}
        />

        <div className="text-xs text-[var(--ui-text-muted)]">
          Details include day length, solar noon, golden hour, and civil twilight times.
        </div>
      </OptionsSection>

      {/* Refresh */}
      <OptionsSection title="Refresh" divider>
        <FormSelect
          label="Auto-refresh every"
          name="refreshInterval"
          value={String(state.refreshInterval)}
          options={[
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '120', label: '2 hours' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />
      </OptionsSection>

      {/* Preview */}
      <OptionsPreview>
        <div className="text-xs text-[var(--color-accent)] mb-1">{state.locationName}</div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <AppIcon name="sunrise" className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-bold text-white mt-0.5">
              {state.timeFormat === '12h' ? '6:45 AM' : '06:45'}
            </span>
            <span className="text-xs text-white/50">Sunrise</span>
          </div>
          <div className="flex flex-col items-center">
            <AppIcon name="sunset" className="w-6 h-6 text-orange-400" />
            <span className="text-lg font-bold text-white mt-0.5">
              {state.timeFormat === '12h' ? '7:20 PM' : '19:20'}
            </span>
            <span className="text-xs text-white/50">Sunset</span>
          </div>
        </div>
        {state.showDetails && (
          <div className="mt-2 text-xs text-white/50">
            12h 35m daylight
          </div>
        )}
      </OptionsPreview>
    </OptionsPanel>
  );
}
