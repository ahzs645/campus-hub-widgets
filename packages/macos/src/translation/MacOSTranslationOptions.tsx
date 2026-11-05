'use client';
import { FormInput } from '@firstform/campus-hub-widget-sdk';

import { useEffect, useState } from 'react';
import {
  FormSelect,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-TW', label: 'Traditional Chinese' },
  { value: 'ru', label: 'Russian' },
];

interface TranslationOptionsState {
  fromLang: string;
  toLang: string;
}

export default function MacOSTranslationOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<TranslationOptionsState>({
    fromLang: (data.fromLang as string) ?? 'en',
    toLang: (data.toLang as string) ?? 'fr',
  });

  useEffect(() => {
    setState({
      fromLang: (data.fromLang as string) ?? 'en',
      toLang: (data.toLang as string) ?? 'fr',
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange({ ...data, ...next });
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Languages">
        <FormInput label="Provider source URL" name="apiUrl" type="url" value={String(data.apiUrl ?? '')} onChange={(_name, value) => onChange({ ...data, apiUrl: value })} placeholder="Select a source or enter an API URL" />
        <FormSelect
          label="From"
          name="fromLang"
          value={state.fromLang}
          onChange={handleChange}
          options={LANGUAGE_OPTIONS}
        />
        <FormSelect
          label="To"
          name="toLang"
          value={state.toLang}
          onChange={handleChange}
          options={LANGUAGE_OPTIONS}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}

