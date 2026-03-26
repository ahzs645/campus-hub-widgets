'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface GasPricesData {
  url: string;
  refreshInterval: number;
  useCorsProxy: boolean;
  maxStations: number;
}

export default function GasPricesOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<GasPricesData>({
    url: (data?.url as string) ?? 'https://www.gasbuddy.com/gasprices/british-columbia/prince-george',
    refreshInterval: (data?.refreshInterval as number) ?? 30,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
    maxStations: (data?.maxStations as number) ?? 10,
  });

  useEffect(() => {
    if (data) {
      setState({
        url: (data.url as string) ?? 'https://www.gasbuddy.com/gasprices/british-columbia/prince-george',
        refreshInterval: (data.refreshInterval as number) ?? 30,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
        maxStations: (data.maxStations as number) ?? 10,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <div className="space-y-4">
      <FormInput
        label="GasBuddy URL"
        name="url"
        value={state.url}
        placeholder="https://www.gasbuddy.com/gasprices/..."
        onChange={handleChange}
      />

      <FormInput
        label="Refresh Interval (minutes)"
        name="refreshInterval"
        type="number"
        value={state.refreshInterval}
        min={5}
        max={120}
        onChange={handleChange}
      />

      <FormInput
        label="Max Stations"
        name="maxStations"
        type="number"
        value={state.maxStations}
        min={1}
        max={20}
        onChange={handleChange}
      />

      <FormSelect
        label="Use CORS Proxy"
        name="useCorsProxy"
        value={state.useCorsProxy ? 'yes' : 'no'}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ]}
        onChange={handleChange}
      />
    </div>
  );
}
