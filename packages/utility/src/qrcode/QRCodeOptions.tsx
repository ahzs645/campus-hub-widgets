'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface QRCodeData {
  text: string;
  label: string;
  fgColor: string;
  bgColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}

function resolveColor(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export default function QRCodeOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<QRCodeData>({
    text: (data?.text as string) ?? '',
    label: (data?.label as string) ?? '',
    fgColor: (data?.fgColor as string) ?? '',
    bgColor: (data?.bgColor as string) ?? '',
    errorCorrection: (data?.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M',
  });

  const resolvedFgColor = resolveColor(state.fgColor, '#000000');
  const resolvedBgColor = resolveColor(state.bgColor, '#ffffff');

  useEffect(() => {
    if (data) {
      setState({
        text: (data.text as string) ?? '',
        label: (data.label as string) ?? '',
        fgColor: (data.fgColor as string) ?? '',
        bgColor: (data.bgColor as string) ?? '',
        errorCorrection: (data.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">QR Code Settings</h3>

        <FormInput
          label="Text / URL"
          name="text"
          type="text"
          value={state.text}
          placeholder="https://example.com"
          onChange={handleChange}
        />

        <FormInput
          label="Label"
          name="label"
          type="text"
          value={state.label}
          placeholder="Optional label below QR code"
          onChange={handleChange}
        />

        <FormSelect
          label="Error Correction"
          name="errorCorrection"
          value={state.errorCorrection}
          options={[
            { value: 'L', label: 'Low (7%)' },
            { value: 'M', label: 'Medium (15%)' },
            { value: 'Q', label: 'Quartile (25%)' },
            { value: 'H', label: 'High (30%)' },
          ]}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Colors</h3>
        <p className="text-xs text-[var(--ui-text-muted)]">
          Leave a color unset to inherit the active theme preset in the live widget.
        </p>

        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Foreground</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedFgColor}
                onChange={(e) => handleChange('fgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">
                {state.fgColor || 'Theme accent'}
              </span>
              <button
                type="button"
                onClick={() => handleChange('fgColor', '')}
                disabled={!state.fgColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedBgColor}
                onChange={(e) => handleChange('bgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">
                {state.bgColor || 'Theme primary'}
              </span>
              <button
                type="button"
                onClick={() => handleChange('bgColor', '')}
                disabled={!state.bgColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
