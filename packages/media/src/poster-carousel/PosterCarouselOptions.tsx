'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch, describeCapabilities } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

type DataSource = 'default' | 'api' | 'unbc-news';
type UNBCImageQuality = 'original' | 'thumbnail';

interface PosterCarouselData {
  rotationSeconds: number;
  dataSource: DataSource;
  apiUrl: string;
  maxStories: number;
  refreshInterval: number;
  useCorsProxy: boolean;
  imageQuality: UNBCImageQuality;
  showText: boolean;
  showProgressBar: boolean;
  showSequenceIndicator: boolean;
}

export default function PosterCarouselOptions({ data, onChange, linkedSource }: WidgetOptionsProps) {
  const [state, setState] = useState<PosterCarouselData>({
    rotationSeconds: (data?.rotationSeconds as number) ?? 10,
    dataSource: (data?.dataSource as DataSource) ?? 'default',
    apiUrl: (data?.apiUrl as string) ?? '',
    maxStories: (data?.maxStories as number) ?? 5,
    refreshInterval: (data?.refreshInterval as number) ?? 30,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
    imageQuality: (data?.imageQuality as UNBCImageQuality) ?? 'original',
    showText: (data?.showText as boolean) ?? true,
    showProgressBar: (data?.showProgressBar as boolean) ?? true,
    showSequenceIndicator: (data?.showSequenceIndicator as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        rotationSeconds: (data.rotationSeconds as number) ?? 10,
        dataSource: (data.dataSource as DataSource) ?? 'default',
        apiUrl: (data.apiUrl as string) ?? '',
        maxStories: (data.maxStories as number) ?? 5,
        refreshInterval: (data.refreshInterval as number) ?? 30,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
        imageQuality: (data.imageQuality as UNBCImageQuality) ?? 'original',
        showText: (data.showText as boolean) ?? true,
        showProgressBar: (data.showProgressBar as boolean) ?? true,
        showSequenceIndicator: (data.showSequenceIndicator as boolean) ?? true,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    // Preserve fields this form doesn't own (e.g. `posters`, `__sourceRef`).
    onChange({ ...data, ...newState });
  };

  // Switch back to manually-managed posters, unlinking any library source.
  const handleUseManual = () => {
    const next = { ...data };
    delete (next as Record<string, unknown>).__sourceRef;
    const newState = { ...state, dataSource: 'default' as DataSource };
    setState(newState);
    onChange({ ...next, ...newState });
  };

  const isUNBC = state.dataSource === 'unbc-news';
  const isAPI = state.dataSource === 'api';
  // A "live" data source is anything other than manually-managed posters. This
  // also covers legacy widgets that set `dataSource` without a `__sourceRef`.
  const isLinked = Boolean(linkedSource) || Boolean(data.__sourceRef) || isUNBC || isAPI;
  const linkedName = linkedSource?.name ?? (isUNBC ? 'UNBC News Releases' : isAPI ? 'JSON API' : 'Library source');
  const linkedUrl = linkedSource?.url ?? (isAPI && typeof data.apiUrl === 'string' ? data.apiUrl : undefined);
  const capabilityChips = linkedSource?.capabilities ? describeCapabilities(linkedSource.capabilities) : [];

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Carousel Settings</h3>

        <FormInput
          label="Rotation Speed (seconds)"
          name="rotationSeconds"
          type="number"
          value={state.rotationSeconds}
          min={3}
          max={60}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Each poster will display for {state.rotationSeconds} seconds before transitioning to the next.
        </div>

        <FormSwitch
          label="Show Text"
          name="showText"
          checked={state.showText}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Top Loading Bar"
          name="showProgressBar"
          checked={state.showProgressBar}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Sequence Indicator"
          name="showSequenceIndicator"
          checked={state.showSequenceIndicator}
          onChange={handleChange}
        />
      </div>

      {/* Data Source */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Data Source</h3>

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
                Use manual posters
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
            {isUNBC && !linkedSource?.capabilities && (
              <div className="mt-2 text-xs text-[var(--ui-text-muted)]">
                Latest news stories from the UNBC media releases page, with images and dates.
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--ui-text-muted)]">
            Showing manually-added posters. To pull from a live feed or API, link a source in the{' '}
            <span className="font-medium text-[var(--ui-text)]">Content Source</span> panel above.
          </div>
        )}
      </div>

      {/* API Configuration - only for JSON API mode */}
      {isAPI && (
        <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
          <h3 className="font-semibold text-[var(--ui-text)]">API Configuration</h3>

          <FormInput
            label="API URL"
            name="apiUrl"
            type="url"
            value={state.apiUrl}
            placeholder="https://api.example.com/posters"
            onChange={handleChange}
          />

          <div className="text-sm text-[var(--ui-text-muted)]">
            The API should return an array of objects with:
            <code className="block mt-2 p-2 bg-[var(--ui-item-bg)] rounded text-xs">
              {`[{ "title": "...", "subtitle": "...", "image": "url" }]`}
            </code>
          </div>
        </div>
      )}

      {/* UNBC News Settings */}
      {isUNBC && (
        <>
          <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
            <h3 className="font-semibold text-[var(--ui-text)]">News Settings</h3>

            <FormInput
              label="Number of Stories"
              name="maxStories"
              type="number"
              value={state.maxStories}
              min={1}
              max={20}
              onChange={handleChange}
            />

            <FormSelect
              label="Image Quality"
              name="imageQuality"
              value={state.imageQuality}
              options={[
                { value: 'original', label: 'Original upload (best)' },
                { value: 'thumbnail', label: 'Listing thumbnail (fastest)' },
              ]}
              onChange={handleChange}
            />

            <div className="text-sm text-[var(--ui-text-muted)]">
              Original upload uses the public source image from UNBC instead of the small thumbnail from the releases list.
            </div>

            <FormSwitch
              label="Use CORS Proxy"
              name="useCorsProxy"
              checked={state.useCorsProxy}
              onChange={handleChange}
            />

            <FormSelect
              label="Refresh Interval"
              name="refreshInterval"
              value={String(state.refreshInterval)}
              options={[
                { value: '10', label: '10 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
              ]}
              onChange={(name, value) => handleChange(name, Number(value))}
            />
          </div>

        </>
      )}

      {/* Preview */}
      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="font-semibold text-[var(--ui-text)] mb-4">Preview</h4>
        <div className="bg-[var(--ui-item-bg)] rounded-xl p-4 aspect-video relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop"
            alt="Sample poster"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {state.showText && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="text-2xl font-bold text-white">
                  {isUNBC ? 'Latest UNBC Story' : 'Sample Event'}
                </div>
                <div className="text-sm text-white/80">
                  {isUNBC ? 'Feb 17, 2026' : 'March 15-17 | Main Quad'}
                </div>
              </div>
            </>
          )}
          {state.showProgressBar && (
            <div className="absolute top-2 left-2 right-2 h-1 bg-black/30 rounded">
              <div className="h-full w-1/3 bg-[var(--color-accent)] rounded" />
            </div>
          )}
          {state.showSequenceIndicator && (
            <div className="absolute bottom-3 right-3 flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              <span className="h-2 w-2 rounded-full bg-white/50" />
              <span className="h-2 w-2 rounded-full bg-white/50" />
            </div>
          )}
          {isUNBC && (
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-sm">
              UNBC News
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
