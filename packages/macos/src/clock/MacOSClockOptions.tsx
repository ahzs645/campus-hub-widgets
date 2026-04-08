'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSwitch,
  OptionsPanel,
  OptionsPreview,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface ClockOptionsState {
  timezone: string;
  cityLabel: string;
  showSeconds: boolean;
  showDigital: boolean;
}

export default function MacOSClockOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<ClockOptionsState>({
    timezone: (data.timezone as string) ?? '',
    cityLabel: (data.cityLabel as string) ?? '',
    showSeconds: (data.showSeconds as boolean) ?? true,
    showDigital: (data.showDigital as boolean) ?? true,
  });

  useEffect(() => {
    setState({
      timezone: (data.timezone as string) ?? '',
      cityLabel: (data.cityLabel as string) ?? '',
      showSeconds: (data.showSeconds as boolean) ?? true,
      showDigital: (data.showDigital as boolean) ?? true,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Location">
        <FormInput
          label="Time zone"
          name="timezone"
          value={state.timezone}
          placeholder="America/Vancouver"
          onChange={handleChange}
        />
        <FormInput
          label="Label override"
          name="cityLabel"
          value={state.cityLabel}
          placeholder="Vancouver"
          onChange={handleChange}
        />
      </OptionsSection>
      <OptionsSection title="Display" divider>
        <FormSwitch
          label="Show seconds"
          name="showSeconds"
          checked={state.showSeconds}
          onChange={handleChange}
        />
        <FormSwitch
          label="Show digital time"
          name="showDigital"
          checked={state.showDigital}
          onChange={handleChange}
        />
      </OptionsSection>
      <OptionsPreview title="Notes">
        <div className="text-center text-sm text-[var(--ui-text-muted)]">
          Use any IANA time zone. If no label is provided, the city name is
          inferred from the zone.
        </div>
      </OptionsPreview>
    </OptionsPanel>
  );
}
