'use client';
import { useState, useEffect } from 'react';
import { FormSwitch } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface F1CountdownData {
  showSessions: boolean;
}

export default function F1CountdownOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<F1CountdownData>({
    showSessions: (data?.showSessions as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        showSessions: (data.showSessions as boolean) ?? true,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState as unknown as Record<string, unknown>);
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)] text-center">Settings</h3>

        <FormSwitch
          label="Show Sessions"
          name="showSessions"
          checked={state.showSessions}
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          Display upcoming session times (Practice, Qualifying, Race) below the countdown.
        </div>
      </div>

    </div>
  );
}
