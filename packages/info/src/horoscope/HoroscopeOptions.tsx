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

type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

interface HoroscopeOptionsState {
  sign: ZodiacSign;
  title: string;
  showLucky: boolean;
  showTraits: boolean;
  tone: 'balanced' | 'bold' | 'gentle';
}

function normalizeState(data: Record<string, unknown> | undefined): HoroscopeOptionsState {
  return {
    sign: (data?.sign as ZodiacSign) ?? 'Aries',
    title: (data?.title as string) ?? 'Daily Horoscope',
    showLucky: (data?.showLucky as boolean) ?? true,
    showTraits: (data?.showTraits as boolean) ?? true,
    tone: (data?.tone as HoroscopeOptionsState['tone']) ?? 'balanced',
  };
}

export default function HoroscopeOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<HoroscopeOptionsState>(normalizeState(data));

  useEffect(() => {
    setState(normalizeState(data));
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value } as HoroscopeOptionsState;
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Sign">
        <FormSelect
          label="Zodiac Sign"
          name="sign"
          value={state.sign}
          options={[
            'Aries',
            'Taurus',
            'Gemini',
            'Cancer',
            'Leo',
            'Virgo',
            'Libra',
            'Scorpio',
            'Sagittarius',
            'Capricorn',
            'Aquarius',
            'Pisces',
          ].map((sign) => ({ value: sign, label: sign }))}
          onChange={handleChange}
        />

        <FormInput
          label="Widget Title"
          name="title"
          value={state.title}
          placeholder="Daily Horoscope"
          onChange={handleChange}
        />
      </OptionsSection>

      <OptionsSection title="Tone" divider>
        <FormSelect
          label="Reading Style"
          name="tone"
          value={state.tone}
          options={[
            { value: 'balanced', label: 'Balanced' },
            { value: 'bold', label: 'Bold' },
            { value: 'gentle', label: 'Gentle' },
          ]}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Lucky Details"
          name="showLucky"
          checked={state.showLucky}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Sign Traits"
          name="showTraits"
          checked={state.showTraits}
          onChange={handleChange}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}
