'use client';
import { useEffect, useState } from 'react';
import { FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface FortuneCookieData {
  openInterval: number;
}

const INTERVAL_OPTIONS = [
  { value: '8', label: '8 seconds' },
  { value: '12', label: '12 seconds' },
  { value: '20', label: '20 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '45', label: '45 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
];

export default function FortuneCookieOptions({ data, onChange }: WidgetOptionsProps) {
  const [openInterval, setOpenInterval] = useState<number>(
    (data?.openInterval as number) ?? 20,
  );

  useEffect(() => {
    if (data) {
      setOpenInterval((data.openInterval as number) ?? 20);
    }
  }, [data]);

  const handleChange = (_name: string, value: string | number | boolean) => {
    const nextInterval = Number(value);
    setOpenInterval(nextInterval);
    onChange({ ...data, openInterval: nextInterval });
  };

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto">
      <FormSelect
        label="Open Interval"
        name="openInterval"
        value={String(openInterval)}
        options={INTERVAL_OPTIONS}
        onChange={handleChange}
      />
      <div className="text-xs text-[var(--ui-text-muted)] text-center">
        How often the fortune cookie cracks open and reveals a new message.
      </div>
    </div>
  );
}
