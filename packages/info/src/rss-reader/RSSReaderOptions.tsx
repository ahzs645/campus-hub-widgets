'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch, describeCapabilities } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface RSSData {
  feedUrl: string;
  maxItems: number;
  refreshInterval: number;
  showDescription: boolean;
  showDate: boolean;
  scrollSpeed: number;
  title: string;
  useCorsProxy: boolean;
}

export default function RSSReaderOptions({ data, onChange, linkedSource }: WidgetOptionsProps) {
  const [state, setState] = useState<RSSData>({
    feedUrl: (data?.feedUrl as string) ?? '',
    maxItems: (data?.maxItems as number) ?? 10,
    refreshInterval: (data?.refreshInterval as number) ?? 15,
    showDescription: (data?.showDescription as boolean) ?? true,
    showDate: (data?.showDate as boolean) ?? true,
    scrollSpeed: (data?.scrollSpeed as number) ?? 40,
    title: (data?.title as string) ?? '',
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        feedUrl: (data.feedUrl as string) ?? '',
        maxItems: (data.maxItems as number) ?? 10,
        refreshInterval: (data.refreshInterval as number) ?? 15,
        showDescription: (data.showDescription as boolean) ?? true,
        showDate: (data.showDate as boolean) ?? true,
        scrollSpeed: (data.scrollSpeed as number) ?? 40,
        title: (data.title as string) ?? '',
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    // Preserve fields this form doesn't own (e.g. `__sourceRef`).
    onChange({ ...data, ...newState });
  };

  // Keep the current feed URL but unlink the library source.
  const handleUseManual = () => {
    const next = { ...data };
    delete (next as Record<string, unknown>).__sourceRef;
    onChange({ ...next, ...state });
  };

  const isLinked = Boolean(linkedSource) || Boolean(data.__sourceRef);
  const linkedName = linkedSource?.name ?? 'Library source';
  const linkedUrl = linkedSource?.url ?? (typeof data.feedUrl === 'string' && data.feedUrl ? data.feedUrl : undefined);
  const capabilityChips = linkedSource?.capabilities ? describeCapabilities(linkedSource.capabilities) : [];

  return (
    <div className="space-y-6">
      {/* Feed URL */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Feed Source</h3>

        {isLinked ? (
          <div className="rounded-lg border border-[color:var(--ui-accent-soft)] bg-[var(--ui-accent-soft)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">Linked source</div>
                <div className="mt-0.5 text-sm font-medium truncate text-[var(--ui-text)]">
                  {linkedName}
                </div>
                {linkedUrl && (
                  <div className="text-xs truncate text-[var(--ui-text-muted)]">{linkedUrl}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleUseManual}
                className="flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-[var(--ui-text-muted)] hover:bg-[var(--ui-item-hover)] hover:text-[var(--ui-text)] transition-colors"
              >
                Use manual URL
              </button>
            </div>
            {capabilityChips.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {capabilityChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[color:var(--ui-item-border)] bg-[var(--ui-item-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <FormInput
              label="RSS/Atom Feed URL"
              name="feedUrl"
              type="text"
              value={state.feedUrl}
              placeholder="https://example.com/feed.xml"
              onChange={handleChange}
            />

            <div className="text-sm text-[var(--ui-text-muted)]">
              Leave empty to show demo data. Supports RSS 2.0 and Atom feeds.
            </div>
          </>
        )}

        <FormInput
          label="Custom Title (optional)"
          name="title"
          type="text"
          value={state.title}
          placeholder="Auto-detected from feed"
          onChange={handleChange}
        />
      </div>

      {/* Display */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Display</h3>

        <FormSelect
          label="Max Items"
          name="maxItems"
          value={String(state.maxItems)}
          options={[
            { value: '5', label: '5 items' },
            { value: '10', label: '10 items' },
            { value: '15', label: '15 items' },
            { value: '20', label: '20 items' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <FormSwitch
          label="Show Description"
          name="showDescription"
          checked={state.showDescription}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Time"
          name="showDate"
          checked={state.showDate}
          onChange={handleChange}
        />

        <FormSelect
          label="Scroll Speed"
          name="scrollSpeed"
          value={String(state.scrollSpeed)}
          options={[
            { value: '20', label: 'Fast' },
            { value: '40', label: 'Normal' },
            { value: '60', label: 'Slow' },
            { value: '0', label: 'No scroll' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />
      </div>

      {/* Refresh */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Refresh</h3>

        <FormSelect
          label="Auto-refresh every"
          name="refreshInterval"
          value={String(state.refreshInterval)}
          options={[
            { value: '5', label: '5 minutes' },
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </div>

    </div>
  );
}
