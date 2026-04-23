'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface UvIndexData {
  dataSource: 'openuv' | 'waqi' | 'weather-network';
  openUvApiKey: string;
  locationMode: 'city' | 'coordinates';
  city: string;
  latitude: number;
  longitude: number;
  waqiToken: string;
  waqiCity: string;
  weatherNetworkUrl: string;
  refreshInterval: number;
}

const DEFAULT_CITY = 'Prince George, BC, Canada';
const DEFAULT_WEATHER_NETWORK_URL = 'https://www.theweathernetwork.com/en/city/ca/british-columbia/prince-george/uv';

const inferLocationMode = (data: WidgetOptionsProps['data'] | undefined): 'city' | 'coordinates' => {
  const savedMode = data?.locationMode as 'city' | 'coordinates' | undefined;
  if (savedMode === 'city' || savedMode === 'coordinates') return savedMode;
  if (typeof data?.latitude === 'number' || typeof data?.longitude === 'number') return 'coordinates';
  return 'city';
};

export default function UvIndexOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<UvIndexData>({
    dataSource: (data?.dataSource as 'openuv' | 'waqi' | 'weather-network') ?? 'openuv',
    openUvApiKey: (data?.openUvApiKey as string) ?? '',
    locationMode: inferLocationMode(data),
    city: (data?.city as string) ?? DEFAULT_CITY,
    latitude: (data?.latitude as number) ?? 53.9171,
    longitude: (data?.longitude as number) ?? -122.7497,
    waqiToken: (data?.waqiToken as string) ?? '',
    waqiCity: (data?.waqiCity as string) ?? 'prince-george',
    weatherNetworkUrl: (data?.weatherNetworkUrl as string) ?? DEFAULT_WEATHER_NETWORK_URL,
    refreshInterval: (data?.refreshInterval as number) ?? 30,
  });

  useEffect(() => {
    if (data) {
      setState({
        dataSource: (data.dataSource as 'openuv' | 'waqi' | 'weather-network') ?? 'openuv',
        openUvApiKey: (data.openUvApiKey as string) ?? '',
        locationMode: inferLocationMode(data),
        city: (data.city as string) ?? DEFAULT_CITY,
        latitude: (data.latitude as number) ?? 53.9171,
        longitude: (data.longitude as number) ?? -122.7497,
        waqiToken: (data.waqiToken as string) ?? '',
        waqiCity: (data.waqiCity as string) ?? 'prince-george',
        weatherNetworkUrl: (data.weatherNetworkUrl as string) ?? DEFAULT_WEATHER_NETWORK_URL,
        refreshInterval: (data.refreshInterval as number) ?? 30,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  const isOpenUv = state.dataSource === 'openuv';
  const isCityLocation = state.locationMode === 'city';
  const isWeatherNetwork = state.dataSource === 'weather-network';

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">Data Source</h3>

        <FormSelect
          label="Source"
          name="dataSource"
          value={state.dataSource}
          options={[
            { value: 'openuv', label: 'OpenUV API (Recommended)' },
            { value: 'weather-network', label: 'The Weather Network URL' },
            { value: 'waqi', label: 'WAQI / AQICN (if station reports UV)' },
          ]}
          onChange={handleChange}
        />

        {isOpenUv ? (
          <>
            <FormInput
              label="OpenUV API Key"
              name="openUvApiKey"
              type="text"
              value={state.openUvApiKey}
              placeholder="Get free key from openuv.io"
              onChange={handleChange}
            />
            <div className="text-xs text-[var(--ui-text-muted)] text-center">
              Free API key from openuv.io. Provides real-time UV index, daily max UV, and sun times.
            </div>

            <FormSelect
              label="Location"
              name="locationMode"
              value={state.locationMode}
              options={[
                { value: 'city', label: 'City name' },
                { value: 'coordinates', label: 'Exact coordinates' },
              ]}
              onChange={handleChange}
            />

            {isCityLocation ? (
              <>
                <FormInput
                  label="City"
                  name="city"
                  type="text"
                  value={state.city}
                  placeholder="Vancouver, BC, Canada"
                  onChange={handleChange}
                />
                <div className="text-xs text-[var(--ui-text-muted)] text-center">
                  City lookup uses the best matching city center. For a campus or exact site, use coordinates.
                </div>
              </>
            ) : (
              <>
                <FormInput
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={state.latitude}
                  placeholder="53.9171"
                  step="0.0001"
                  onChange={handleChange}
                />
                <FormInput
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={state.longitude}
                  placeholder="-122.7497"
                  step="0.0001"
                  onChange={handleChange}
                />
                <div className="text-xs text-[var(--ui-text-muted)] text-center">
                  Coordinates provide the most precise UV data. Default is UNBC (Prince George, BC).
                </div>
              </>
            )}
          </>
        ) : isWeatherNetwork ? (
          <>
            <FormInput
              label="Weather Network UV URL"
              name="weatherNetworkUrl"
              type="text"
              value={state.weatherNetworkUrl}
              placeholder={DEFAULT_WEATHER_NETWORK_URL}
              onChange={handleChange}
            />
            <div className="text-xs text-[var(--ui-text-muted)] text-center">
              Paste any The Weather Network city page ending in /uv. This source requires the configured CORS proxy.
            </div>
          </>
        ) : (
          <>
            <FormInput
              label="WAQI API Token"
              name="waqiToken"
              type="text"
              value={state.waqiToken}
              placeholder="Get free token from aqicn.org/data-platform/token"
              onChange={handleChange}
            />
            <FormInput
              label="City / Station"
              name="waqiCity"
              type="text"
              value={state.waqiCity}
              placeholder="prince-george"
              onChange={handleChange}
            />
            <div className="text-xs text-[var(--ui-text-muted)] text-center">
              Note: Not all WAQI stations report UV data. If UV is unavailable, an error will be shown.
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">Settings</h3>

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

      {/* Preview */}
      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="font-semibold text-[var(--ui-text)] mb-4 text-center">Preview</h4>
        <div className="bg-[var(--ui-item-bg)] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-yellow-400">
              <span className="text-xl font-bold text-yellow-900">3</span>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--ui-text)]">Moderate</div>
              <div className="text-xs text-[var(--ui-text-muted)]">Wear sunscreen</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden flex">
            <div className="flex-1 bg-green-400" />
            <div className="flex-1 bg-yellow-400" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-red-500" />
            <div className="flex-1 bg-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
