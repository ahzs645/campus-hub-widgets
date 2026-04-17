'use client';
import { useEffect, useState } from 'react';
import { FormInput, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';
import { buildPowerPointEmbedUrl, looksLikePowerPointInput } from './powerpoint-utils';

interface PowerPointData {
  url: string;
  refreshInterval: number;
  showTitle: boolean;
  title: string;
}

export default function PowerPointOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<PowerPointData>({
    url: (data?.url as string) ?? '',
    refreshInterval: (data?.refreshInterval as number) ?? 0,
    showTitle: (data?.showTitle as boolean) ?? false,
    title: (data?.title as string) ?? '',
  });

  useEffect(() => {
    if (data) {
      setState({
        url: (data.url as string) ?? '',
        refreshInterval: (data.refreshInterval as number) ?? 0,
        showTitle: (data.showTitle as boolean) ?? false,
        title: (data.title as string) ?? '',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const nextState = { ...state, [name]: value };
    setState(nextState);
    onChange(nextState);
  };

  const looksRelevant = looksLikePowerPointInput(state.url);
  const embedUrl = buildPowerPointEmbedUrl(state.url);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">PowerPoint</h3>

        <FormInput
          label="PowerPoint URL"
          name="url"
          type="url"
          value={state.url}
          placeholder="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx"
          onChange={handleChange}
        />

        {state.url && !looksRelevant && (
          <div className="text-sm text-red-400">
            This doesn&apos;t look like a PowerPoint, OneDrive, SharePoint, or Office viewer URL.
          </div>
        )}

        {state.url && looksRelevant && !embedUrl && (
          <div className="text-sm text-amber-400">
            This link may not be embeddable yet. Use the official PowerPoint web embed link or a
            direct public `.ppt` or `.pptx` file URL.
          </div>
        )}

        <div className="rounded-lg border border-[var(--ui-accent-strong)] bg-[var(--ui-accent-soft)] p-4">
          <div className="flex gap-2">
            <AppIcon name="info" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="text-sm text-[var(--ui-text-muted)]">
              <strong>How to get the link:</strong> In PowerPoint for the web, open the file and go
              to File → Share → Embed. Paste the iframe URL here. If your `.ppt` or `.pptx` file is
              already publicly reachable, you can also paste that direct file URL and Campus Hub
              will open it with Office Web Viewer.
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
          Set to 0 to disable reloads. Reloading is useful when the presentation content changes but
          the source URL stays the same.
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Title Bar</h3>

        <FormSwitch
          label="Show Title Bar"
          name="showTitle"
          checked={state.showTitle}
          onChange={handleChange}
        />

        {state.showTitle && (
          <FormInput
            label="Title"
            name="title"
            type="text"
            value={state.title}
            placeholder="Campus Presentation"
            onChange={handleChange}
          />
        )}
      </div>

      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="mb-4 font-semibold text-[var(--ui-text)]">Preview</h4>
        <div className="flex aspect-video items-center justify-center rounded-xl bg-[var(--ui-item-bg)]">
          {embedUrl ? (
            <div className="text-center">
              <AppIcon name="slideshow" className="mx-auto h-9 w-9 text-white/80" />
              <div className="mt-2 text-sm text-white/70">PowerPoint configured</div>
              <div className="mt-1 max-w-xs truncate text-xs text-white/50">{embedUrl}</div>
            </div>
          ) : (
            <div className="text-center">
              <AppIcon name="slideshow" className="mx-auto h-9 w-9 text-white/50" />
              <div className="mt-2 text-sm text-white/50">No embeddable presentation configured</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
