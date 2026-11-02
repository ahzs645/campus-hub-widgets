'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface ExchangeRateOptionsData {
  baseCurrency: string;
  cycleInterval: number;
  /** Comma-separated target currency codes as typed. */
  currencies: string;
  amount: number;
}

const DEFAULT_CURRENCIES = ['EUR', 'GBP', 'JPY', 'INR'];

function toState(data: Record<string, unknown> | undefined): ExchangeRateOptionsData {
  const currencies = Array.isArray(data?.currencies)
    ? (data.currencies as unknown[]).map(String)
    : DEFAULT_CURRENCIES;
  const amount = Number(data?.amount);
  return {
    baseCurrency: (data?.baseCurrency as string) ?? 'USD',
    cycleInterval: Number(data?.cycleInterval) || 10,
    currencies: currencies.join(', '),
    amount: Number.isFinite(amount) && amount > 0 ? amount : 1,
  };
}

function parseCurrencies(value: string): string[] {
  const codes = value
    .split(/[\s,]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{3}$/.test(code));
  return Array.from(new Set(codes));
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
];

const INTERVAL_OPTIONS = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '60 seconds' },
];

export default function ExchangeRateOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<ExchangeRateOptionsData>(() => toState(data));

  useEffect(() => {
    if (!data) return;
    setState((previous) => {
      const next = toState(data);
      // Keep the in-progress text (e.g. a trailing ", ") while it still
      // means the same currency list, so typing is not reset mid-edit.
      if (parseCurrencies(previous.currencies).join(',') === parseCurrencies(next.currencies).join(',')) {
        next.currencies = previous.currencies;
      }
      return next;
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState: ExchangeRateOptionsData = {
      ...state,
      [name]: name === 'cycleInterval' || name === 'amount' ? Number(value) : String(value),
    };
    setState(newState);
    const currencies = parseCurrencies(newState.currencies);
    // Spread the existing data so keys this form does not edit survive.
    onChange({
      ...data,
      baseCurrency: newState.baseCurrency,
      cycleInterval: newState.cycleInterval,
      currencies: currencies.length > 0 ? currencies : DEFAULT_CURRENCIES,
      amount: newState.amount > 0 ? newState.amount : 1,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Exchange Rate Settings</h3>

        <FormSelect
          label="Base Currency"
          name="baseCurrency"
          value={state.baseCurrency}
          options={CURRENCY_OPTIONS}
          onChange={handleChange}
        />

        <FormInput
          label="Target Currencies"
          name="currencies"
          value={state.currencies}
          placeholder="EUR, GBP, JPY"
          onChange={handleChange}
        />
        <p className="-mt-2 text-xs text-[var(--ui-text-muted)]">
          Three-letter currency codes, separated by commas.
        </p>

        <FormInput
          label="Amount"
          name="amount"
          type="number"
          min={0}
          step="any"
          value={state.amount}
          onChange={handleChange}
        />

        <FormSelect
          label="Cycle Interval"
          name="cycleInterval"
          value={String(state.cycleInterval)}
          options={INTERVAL_OPTIONS}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
