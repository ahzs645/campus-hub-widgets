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
  location: string;
  units: 'metric' | 'imperial';
  showForecast: boolean;
}

export default function MacOSWeatherOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<WeatherOptionsState>({
    location: (data.location as string) ?? 'Vancouver',
    units: ((data.units as 'metric' | 'imperial') ?? 'metric'),
    showForecast: (data.showForecast as boolean) ?? true,
  });

  useEffect(() => {
    setState({
      location: (data.location as string) ?? 'Vancouver',
      units: ((data.units as 'metric' | 'imperial') ?? 'metric'),
      showForecast: (data.showForecast as boolean) ?? true,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Forecast">
        <FormInput
          label="Location"
          name="location"
          value={state.location}
          placeholder="Vancouver"
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
