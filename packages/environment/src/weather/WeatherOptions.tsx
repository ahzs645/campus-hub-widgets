'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch, OptionsPanel, OptionsSection } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

type DisplayMode = 'full' | 'temperature-only' | 'wind-only' | 'minimal' | 'custom';
type WeatherAppearance = 'default' | 'dashboard-macos';

interface DisplayItems {
  location: boolean;
  icon: boolean;
  temperature: boolean;
  condition: boolean;
  humidity: boolean;
  wind: boolean;
  pressure: boolean;
  dewPoint: boolean;
  windGust: boolean;
  precipitation: boolean;
  lastUpdated: boolean;
}

const DEFAULT_ITEMS: DisplayItems = {
  location: true, icon: true, temperature: true, condition: true,
  humidity: true, wind: true, pressure: true, dewPoint: false,
  windGust: false, precipitation: false, lastUpdated: true,
};

const MODE_PRESETS: Record<Exclude<DisplayMode, 'custom'>, DisplayItems> = {
  full: { ...DEFAULT_ITEMS },
  'temperature-only': {
    ...DEFAULT_ITEMS, humidity: false, wind: false, pressure: false, lastUpdated: false,
  },
  'wind-only': {
    location: true, icon: false, temperature: false, condition: false,
    humidity: false, wind: true, pressure: false, dewPoint: false,
    windGust: true, precipitation: false, lastUpdated: false,
  },
  minimal: {
    location: false, icon: true, temperature: true, condition: false,
    humidity: false, wind: false, pressure: false, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: false,
  },
};

const ITEM_LABELS: Record<keyof DisplayItems, string> = {
  location: 'Location Name',
  icon: 'Weather Icon',
  temperature: 'Temperature',
  condition: 'Condition Text',
  humidity: 'Humidity',
  wind: 'Wind Speed',
  pressure: 'Pressure',
  dewPoint: 'Dew Point',
  windGust: 'Wind Gusts',
  precipitation: 'Precipitation',
  lastUpdated: 'Last Updated Time',
};

const GEOMET_DEFAULT_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/bc-79?f=json&lang=en';

interface WeatherData {
  location: string;
  units: 'celsius' | 'fahrenheit';
  showDetails: boolean;
  displayMode: DisplayMode;
  displayItems: DisplayItems;
  apiKey: string;
  apiUrl: string;
  dataSource: 'openweathermap' | 'unbc-rooftop' | 'msc-geomet';
  refreshInterval: number;
  useCorsProxy: boolean;
  appearance: WeatherAppearance;
}

export default function WeatherOptions({ data, onChange }: WidgetOptionsProps) {
  const parseItems = (raw: unknown): DisplayItems => {
    if (raw && typeof raw === 'object') return { ...DEFAULT_ITEMS, ...(raw as Partial<DisplayItems>) };
    return { ...DEFAULT_ITEMS };
  };

  const readDataSource = (value: unknown): WeatherData['dataSource'] =>
    value === 'source'
      ? data.sourceAdapter === 'unbc-rooftop-weather'
        ? 'unbc-rooftop'
        : data.sourceAdapter === 'msc-geomet-weather'
          ? 'msc-geomet'
          : 'openweathermap'
      : (value as WeatherData['dataSource']) ?? 'openweathermap';

  const [state, setState] = useState<WeatherData>({
    location: (data?.location as string) ?? 'Campus',
    units: (data?.units as 'celsius' | 'fahrenheit') ?? 'fahrenheit',
    showDetails: (data?.showDetails as boolean) ?? true,
    displayMode: (data?.displayMode as DisplayMode) ?? 'full',
    displayItems: parseItems(data?.displayItems),
    apiKey: (data?.apiKey as string) ?? '',
    apiUrl: (data?.apiUrl as string) ?? GEOMET_DEFAULT_URL,
    dataSource: readDataSource(data?.dataSource),
    refreshInterval: (data?.refreshInterval as number) ?? 10,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
    appearance: (data?.appearance as WeatherAppearance) ?? 'default',
  });

  useEffect(() => {
    if (data) {
      setState({
        location: (data.location as string) ?? 'Campus',
        units: (data.units as 'celsius' | 'fahrenheit') ?? 'fahrenheit',
        showDetails: (data.showDetails as boolean) ?? true,
        displayMode: (data.displayMode as DisplayMode) ?? 'full',
        displayItems: parseItems(data.displayItems),
        apiKey: (data.apiKey as string) ?? '',
        apiUrl: (data.apiUrl as string) ?? GEOMET_DEFAULT_URL,
        dataSource: readDataSource(data.dataSource),
        refreshInterval: (data.refreshInterval as number) ?? 10,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
        appearance: (data.appearance as WeatherAppearance) ?? 'default',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    // Preserve source linkage and adapter metadata owned by the source picker.
    onChange({ ...data, ...newState });
  };

  const isUNBC = state.dataSource === 'unbc-rooftop';
  const isGeoMet = state.dataSource === 'msc-geomet';

  return (
    <OptionsPanel>
      {/* Data Source */}
      <OptionsSection title="Data Source">

        <FormSelect
          label="Weather Source"
          name="dataSource"
          value={state.dataSource}
          options={[
            { value: 'openweathermap', label: 'OpenWeatherMap API' },
            { value: 'unbc-rooftop', label: 'UNBC Rooftop Station' },
            { value: 'msc-geomet', label: 'Environment Canada (MSC GeoMet)' },
          ]}
          onChange={handleChange}
        />

        {isUNBC && (
          <div className="text-sm text-[var(--ui-text-muted)]">
            Live data from the UNBC lab building rooftop weather station in Prince George, BC.
            Provides 1-minute averaged readings including temperature, humidity, wind, and pressure.
          </div>
        )}

        {isGeoMet && (
          <div className="text-sm text-[var(--ui-text-muted)]">
            Official Environment and Climate Change Canada city weather endpoint with current conditions,
            hourly forecast, and warnings. Paste any
            {' '}
            <code>citypageweather-realtime/items/&lt;city-id&gt;</code>
            {' '}
            URL or link one from your source library.
          </div>
        )}
      </OptionsSection>

      {/* Settings */}
      <OptionsSection title="Weather Settings" divider>

        {!isUNBC && !isGeoMet && (
          <FormInput
            label="Location"
            name="location"
            type="text"
            value={state.location}
            placeholder="Campus"
            onChange={handleChange}
          />
        )}

        {isGeoMet && (
          <FormInput
            label="GeoMet API URL"
            name="apiUrl"
            type="text"
            value={state.apiUrl}
            placeholder={GEOMET_DEFAULT_URL}
            onChange={handleChange}
          />
        )}

        <FormSelect
          label="Temperature Units"
          name="units"
          value={state.units}
          options={[
            { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
            { value: 'celsius', label: 'Celsius (°C)' },
          ]}
          onChange={handleChange}
        />
      </OptionsSection>

      {/* Display Mode */}
      <OptionsSection title="Display Mode" divider>
        <FormSelect
          label="Appearance"
          name="appearance"
          value={state.appearance}
          options={[
            { value: 'default', label: 'Default Widget Theme' },
            { value: 'dashboard-macos', label: 'Dashboard macOS Style' },
          ]}
          onChange={handleChange}
        />

        <FormSelect
          label="What to show"
          name="displayMode"
          value={state.displayMode}
          options={[
            { value: 'full', label: 'Full (all details)' },
            { value: 'temperature-only', label: 'Temperature Only' },
            { value: 'wind-only', label: 'Wind Only' },
            { value: 'minimal', label: 'Minimal (icon + temp)' },
            { value: 'custom', label: 'Custom…' },
          ]}
          onChange={(name, value) => {
            const mode = value as DisplayMode;
            if (mode !== 'custom') {
              const items = MODE_PRESETS[mode];
              const newState = { ...state, displayMode: mode, displayItems: items };
              setState(newState);
              onChange({ ...data, ...newState });
            } else {
              const newState = { ...state, displayMode: mode };
              setState(newState);
              onChange({ ...data, ...newState });
            }
          }}
        />

        {state.displayMode === 'custom' && (
          <div className="space-y-2 pl-1">
            {(Object.keys(ITEM_LABELS) as (keyof DisplayItems)[]).map((key) => (
              <FormSwitch
                key={key}
                label={ITEM_LABELS[key]}
                name={key}
                checked={state.displayItems[key]}
                onChange={(_name, checked) => {
                  const newItems = { ...state.displayItems, [key]: checked };
                  const newState = { ...state, displayItems: newItems };
                  setState(newState);
                  onChange({ ...data, ...newState });
                }}
              />
            ))}
          </div>
        )}

        {state.displayMode !== 'custom' && (
          <div className="text-xs text-[var(--ui-text-muted)]">
            {state.displayMode === 'full' && 'Shows temperature, condition, humidity, wind, pressure, and update time.'}
            {state.displayMode === 'temperature-only' && 'Shows only temperature, condition, and weather icon.'}
            {state.displayMode === 'wind-only' && 'Shows a large wind speed display with direction and gusts.'}
            {state.displayMode === 'minimal' && 'Shows just the weather icon and temperature — nothing else.'}
          </div>
        )}
      </OptionsSection>

      {/* Refresh Interval */}
      <OptionsSection title="Refresh Interval" divider>

        <FormSelect
          label="Auto-refresh every"
          name="refreshInterval"
          value={String(state.refreshInterval)}
          options={[
            { value: '1', label: '1 minute' },
            { value: '5', label: '5 minutes' },
            { value: '10', label: '10 minutes' },
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />
      </OptionsSection>

      {/* CORS Proxy */}
      <OptionsSection title="CORS Proxy" divider>
        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </OptionsSection>

      {/* API Configuration - only for OpenWeatherMap */}
      {!isUNBC && !isGeoMet && (
        <OptionsSection title="API Configuration" divider>

          <FormInput
            label="Weather API Key (optional)"
            name="apiKey"
            type="text"
            value={state.apiKey}
            placeholder="Enter API key for live data"
            onChange={handleChange}
          />

          <div className="text-sm text-[var(--ui-text-muted)]">
            Leave empty to use demo data. Supports OpenWeatherMap API.
          </div>
        </OptionsSection>
      )}

    </OptionsPanel>
  );
}
