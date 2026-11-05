'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface WeatherOptionsState {
  apiUrl: string;
  location: string;
  units: 'metric' | 'imperial';
  showForecast: boolean;
}

export default function MacOSWeatherOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<WeatherOptionsState>({
    apiUrl: (data.apiUrl as string) ?? '',
    location: (data.location as string) ?? '',
    units: ((data.units as 'metric' | 'imperial') ?? 'metric'),
    showForecast: (data.showForecast as boolean) ?? true,
  });

  useEffect(() => {
    setState({
      apiUrl: (data.apiUrl as string) ?? '',
    location: (data.location as string) ?? '',
      units: ((data.units as 'metric' | 'imperial') ?? 'metric'),
      showForecast: (data.showForecast as boolean) ?? true,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange({ ...data, ...next });
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Forecast">
        <FormInput label="Forecast source URL" name="apiUrl" type="url" value={state.apiUrl} placeholder="Select an Open-Meteo forecast source" onChange={handleChange} />
        <FormInput
          label="Location (legacy lookup)"
          name="location"
          value={state.location}
          placeholder="Optional city lookup"
          onChange={handleChange}
        />
        <FormSelect
          label="Units"
          name="units"
          value={state.units}
          onChange={handleChange}
          options={[
            { value: 'metric', label: 'Metric' },
            { value: 'imperial', label: 'Imperial' },
          ]}
        />
        <FormSwitch
          label="Show 4-day forecast"
          name="showForecast"
          checked={state.showForecast}
          onChange={handleChange}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}

