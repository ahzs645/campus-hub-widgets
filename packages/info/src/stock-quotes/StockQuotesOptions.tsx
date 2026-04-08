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

interface StockQuotesOptionsState {
  title: string;
  symbols: string[];
  symbolsText: string;
  chartSymbol: string;
  range: '1mo' | '3mo' | '6mo' | '1y';
  refreshInterval: number;
  showChart: boolean;
  showChange: boolean;
  showNames: boolean;
}

function symbolsToText(symbols: unknown): string {
  return Array.isArray(symbols)
    ? symbols.map((symbol) => String(symbol).trim().toUpperCase()).filter(Boolean).join(', ')
    : '';
}

function normalizeState(data: Record<string, unknown> | undefined): StockQuotesOptionsState {
  return {
    title: (data?.title as string) ?? 'Stock Quotes',
    symbols: Array.isArray(data?.symbols)
      ? data!.symbols.map((symbol) => String(symbol).trim().toUpperCase()).filter(Boolean)
      : ['AAPL', 'MSFT', 'NVDA', 'SPY'],
    symbolsText: symbolsToText(data?.symbols) || 'AAPL, MSFT, NVDA, SPY',
    chartSymbol: (data?.chartSymbol as string) ?? 'NVDA',
    range: (data?.range as StockQuotesOptionsState['range']) ?? '6mo',
    refreshInterval: (data?.refreshInterval as number) ?? 10,
    showChart: (data?.showChart as boolean) ?? true,
    showChange: (data?.showChange as boolean) ?? true,
    showNames: (data?.showNames as boolean) ?? true,
  };
}

export default function StockQuotesOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<StockQuotesOptionsState>(normalizeState(data));

  useEffect(() => {
    setState(normalizeState(data));
  }, [data]);

  const commit = (next: StockQuotesOptionsState) => {
    setState(next);
    onChange({
      title: next.title,
      symbols: next.symbols,
      chartSymbol: next.chartSymbol.trim().toUpperCase(),
      range: next.range,
      refreshInterval: next.refreshInterval,
      showChart: next.showChart,
      showChange: next.showChange,
      showNames: next.showNames,
    });
  };

  const handleField = (name: string, value: string | number | boolean) => {
    if (name === 'symbolsText') {
      const symbolsText = String(value);
      const symbols = symbolsText
        .split(',')
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 8);
      commit({ ...state, symbolsText, symbols });
      return;
    }

    if (name === 'refreshInterval') {
      commit({ ...state, refreshInterval: Math.max(1, Number(value) || 1) });
      return;
    }

    if (name === 'range') {
      commit({ ...state, range: value as StockQuotesOptionsState['range'] });
      return;
    }

    commit({ ...state, [name]: value });
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Symbols">
        <FormInput
          label="Widget Title"
          name="title"
          value={state.title}
          placeholder="Stock Quotes"
          onChange={handleField}
        />

        <FormInput
          label="Symbols"
          name="symbolsText"
          value={state.symbolsText}
          placeholder="AAPL, MSFT, NVDA, SPY"
          onChange={handleField}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Enter up to 8 comma-separated symbols. US tickers work best.
        </div>

        <FormInput
          label="Lead Chart Symbol"
          name="chartSymbol"
          value={state.chartSymbol}
          placeholder="NVDA"
          onChange={handleField}
        />
      </OptionsSection>

      <OptionsSection title="Display" divider>
        <FormSelect
          label="Chart Range"
          name="range"
          value={state.range}
          options={[
            { value: '1mo', label: '1 month' },
            { value: '3mo', label: '3 months' },
            { value: '6mo', label: '6 months' },
            { value: '1y', label: '1 year' },
          ]}
          onChange={handleField}
        />

        <FormSwitch
          label="Show Lead Chart"
          name="showChart"
          checked={state.showChart}
          onChange={handleField}
        />

        <FormSwitch
          label="Show Change Values"
          name="showChange"
          checked={state.showChange}
          onChange={handleField}
        />

        <FormSwitch
          label="Show Company Names"
          name="showNames"
          checked={state.showNames}
          onChange={handleField}
        />
      </OptionsSection>

      <OptionsSection title="Refresh" divider>
        <FormInput
          label="Refresh Interval (minutes)"
          name="refreshInterval"
          type="number"
          value={state.refreshInterval}
          min={1}
          max={120}
          onChange={handleField}
        />
        <div className="text-sm text-[var(--ui-text-muted)]">
          Uses the app&apos;s stock API route and refreshes on this interval.
        </div>
      </OptionsSection>
    </OptionsPanel>
  );
}
