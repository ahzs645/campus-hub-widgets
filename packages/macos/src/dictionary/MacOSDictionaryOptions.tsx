'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface DictionaryOptionsState {
  initialWord: string;
  showExamples: boolean;
}

export default function MacOSDictionaryOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<DictionaryOptionsState>({
    initialWord: (data.initialWord as string) ?? 'serendipity',
    showExamples: (data.showExamples as boolean) ?? true,
  });

  useEffect(() => {
    setState({
      initialWord: (data.initialWord as string) ?? 'serendipity',
      showExamples: (data.showExamples as boolean) ?? true,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Dictionary">
        <FormInput
          label="Initial word"
          name="initialWord"
          value={state.initialWord}
          onChange={handleChange}
        />
        <FormSwitch
          label="Show example sentences"
          name="showExamples"
          checked={state.showExamples}
          onChange={handleChange}
        />
      </OptionsSection>
    </OptionsPanel>
  );
}
