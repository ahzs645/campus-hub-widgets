'use client';
import { useState, useEffect } from 'react';
import { FormInput } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface CanvaData {
  url: string;
  refreshInterval: number;
}

export default function CanvaOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<CanvaData>({
    url: (data?.url as string) ?? '',
    refreshInterval: (data?.refreshInterval as number) ?? 0,
  });

  useEffect(() => {
    if (data) {
      setState({
        url: (data.url as string) ?? '',
        refreshInterval: (data.refreshInterval as number) ?? 0,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  const isValidUrl = state.url.includes('canva.com');

  return (
    <div className="space-y-6">
      {/* Canva URL */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Canva Design</h3>

        <FormInput
          label="Smart Embed Link"
          name="url"
          type="url"
          value={state.url}
          placeholder="https://www.canva.com/design/.../view?embed"
          onChange={handleChange}
        />

        {state.url && !isValidUrl && (
          <div className="text-sm text-red-400">
            This doesn&apos;t look like a Canva URL.
          </div>
        )}

        <div className="bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-strong)] rounded-lg p-4">
          <div className="flex gap-2">
            <AppIcon name="info" className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[var(--ui-text-muted)]">
              <strong>How to get the link:</strong> In Canva, click Share → More → Embed.
              Copy the &quot;Smart embed link&quot; and paste it here. Your design will display
              directly on your screens without downloads or uploads.
            </div>
          </div>
        </div>

        <FormInput
          label="Refresh Interval (seconds)"
          name="refreshInterval"
          type="number"
          value={state.refreshInterval}
          min={0}
          max={3600}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Set to 0 to disable auto-refresh. Useful if you update your Canva design frequently.
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="font-semibold text-[var(--ui-text)] mb-4">Preview</h4>
        <div className="bg-[var(--ui-item-bg)] rounded-xl aspect-video flex items-center justify-center">
          {isValidUrl ? (
            <div className="text-center">
              <AppIcon name="palette" className="w-9 h-9 mx-auto text-white/80" />
              <div className="text-white/70 text-sm mt-2">Canva design configured</div>
              <div className="text-white/50 text-xs mt-1 truncate max-w-xs">{state.url}</div>
            </div>
          ) : (
            <div className="text-center">
              <AppIcon name="palette" className="w-9 h-9 opacity-50 mx-auto text-white/70" />
              <div className="text-white/50 text-sm mt-2">No design configured</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
