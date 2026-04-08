'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface StocksOptionsState {
  symbols: string;
  range: string;
}

export default function MacOSStocksOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<StocksOptionsState>({
    symbols: (data.symbols as string) ?? 'AAPL,MSFT,NVDA,GOOG',
    range: (data.range as string) ?? '6mo',
  });

  useEffect(() => {
    setState({
      symbols: (data.symbols as string) ?? 'AAPL,MSFT,NVDA,GOOG',
      range: (data.range as string) ?? '6mo',
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Market Watch">
        <FormInput
          label="Symbols"
          name="symbols"
          value={state.symbols}
          placeholder="AAPL,MSFT,NVDA,GOOG"
          onChange={handleChange}
        />
        <FormSelect
          label="Chart range"
          name="range"
          value={state.range}
          onChange={handleChange}
          options={[
            { value: '1mo', label: '1 month' },
            { value: '3mo', label: '3 months' },
            { value: '6mo', label: '6 months' },
            { value: '1y', label: '1 year' },
          ]}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}
