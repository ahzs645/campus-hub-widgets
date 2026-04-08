'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  AppIcon,
  FormInput,
  FormSelect,
  FormSwitch,
  getVideoThumbnailUrl,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';
import {
  ISS_LIVE_URL,
  resolveConfiguredStreamUrl,
  type StreamFormat,
  type StreamPreset,
} from './stream-utils';

interface StreamPlayerData {
  preset: StreamPreset;
  format: StreamFormat;
  url: string;
  fallbackUrl: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  pollIntervalSeconds: number;
  showStatus: boolean;
}

const DEFAULT_STATE: StreamPlayerData = {
  preset: 'custom',
  format: 'auto',
  url: '',
  fallbackUrl: '',
  autoplay: true,
  muted: true,
  loop: true,
  controls: true,
  pollIntervalSeconds: 300,
  showStatus: true,
};

export default function StreamPlayerOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<StreamPlayerData>({
    preset: (data?.preset as StreamPreset) ?? DEFAULT_STATE.preset,
    format: (data?.format as StreamFormat) ?? DEFAULT_STATE.format,
    url: (data?.url as string) ?? DEFAULT_STATE.url,
    fallbackUrl: (data?.fallbackUrl as string) ?? DEFAULT_STATE.fallbackUrl,
    autoplay: (data?.autoplay as boolean) ?? DEFAULT_STATE.autoplay,
    muted: (data?.muted as boolean) ?? DEFAULT_STATE.muted,
    loop: (data?.loop as boolean) ?? DEFAULT_STATE.loop,
    controls: (data?.controls as boolean) ?? DEFAULT_STATE.controls,
    pollIntervalSeconds: (data?.pollIntervalSeconds as number) ?? DEFAULT_STATE.pollIntervalSeconds,
    showStatus: (data?.showStatus as boolean) ?? DEFAULT_STATE.showStatus,
  });

  useEffect(() => {
    if (!data) return;
    setState({
      preset: (data.preset as StreamPreset) ?? DEFAULT_STATE.preset,
      format: (data.format as StreamFormat) ?? DEFAULT_STATE.format,
      url: (data.url as string) ?? DEFAULT_STATE.url,
      fallbackUrl: (data.fallbackUrl as string) ?? DEFAULT_STATE.fallbackUrl,
      autoplay: (data.autoplay as boolean) ?? DEFAULT_STATE.autoplay,
      muted: (data.muted as boolean) ?? DEFAULT_STATE.muted,
      loop: (data.loop as boolean) ?? DEFAULT_STATE.loop,
      controls: (data.controls as boolean) ?? DEFAULT_STATE.controls,
      pollIntervalSeconds: (data.pollIntervalSeconds as number) ?? DEFAULT_STATE.pollIntervalSeconds,
      showStatus: (data.showStatus as boolean) ?? DEFAULT_STATE.showStatus,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const nextState = {
      ...state,
      [name]: value,
    };
    setState(nextState);
    onChange(nextState);
  };

  const activeUrl = resolveConfiguredStreamUrl(state.url, state.preset);
  const previewThumbnail = getVideoThumbnailUrl(activeUrl);

  const urlLabel =
    state.format === 'youtube-channel-live'
      ? 'YouTube Handle or Channel URL'
      : 'Stream URL';

  const urlPlaceholder =
    state.format === 'youtube-channel-live'
      ? '@LofiGirl or https://www.youtube.com/@LofiGirl'
      : 'https://example.com/live.m3u8';

  const helpText = useMemo(() => {
    if (state.preset === 'iss-live') {
      return 'Uses the default NASA ISS YouTube stream when the URL field is empty.';
    }

    if (state.format === 'youtube-channel-live') {
      return 'Checks a YouTube channel’s /live page and switches to the active stream when the channel goes live.';
    }

    return 'Auto detect handles YouTube videos, Vimeo, HLS (.m3u8), direct MP4/WebM/audio files, and iframe-style embeds.';
  }, [state.format, state.preset]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Source</h3>

        <FormSelect
          label="Preset"
          name="preset"
          value={state.preset}
          options={[
            { value: 'custom', label: 'Custom' },
            { value: 'iss-live', label: 'ISS Live (NASA)' },
          ]}
          onChange={handleChange}
        />

        <FormSelect
          label="Format"
          name="format"
          value={state.format}
          options={[
            { value: 'auto', label: 'Auto Detect' },
            { value: 'youtube-channel-live', label: 'YouTube Channel Live' },
            { value: 'youtube-video', label: 'YouTube Video or Stream' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'hls', label: 'HLS (.m3u8)' },
            { value: 'video', label: 'Direct Video File' },
            { value: 'audio', label: 'Audio Stream or File' },
            { value: 'embed', label: 'Web Embed / Iframe' },
          ]}
          onChange={handleChange}
        />

        <FormInput
          label={urlLabel}
          name="url"
          type="text"
          value={state.url}
          placeholder={urlPlaceholder}
          onChange={handleChange}
        />

        <FormInput
          label="Fallback URL"
          name="fallbackUrl"
          type="text"
          value={state.fallbackUrl}
          placeholder="Optional fallback when a live channel is offline"
          onChange={handleChange}
        />

        {state.format === 'youtube-channel-live' && (
          <FormInput
            label="Live Check Interval (seconds)"
            name="pollIntervalSeconds"
            type="number"
            min={30}
            max={3600}
            value={state.pollIntervalSeconds}
            onChange={handleChange}
          />
        )}

        <div className="text-sm text-[var(--ui-text-muted)]">
          {helpText}
        </div>
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Playback</h3>

        <FormSwitch
          label="Autoplay"
          name="autoplay"
          checked={state.autoplay}
          onChange={handleChange}
        />

        <FormSwitch
          label="Muted"
          name="muted"
          checked={state.muted}
          onChange={handleChange}
        />

        <FormSwitch
          label="Loop"
          name="loop"
          checked={state.loop}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Controls"
          name="controls"
          checked={state.controls}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Status Badge"
          name="showStatus"
          checked={state.showStatus}
          onChange={handleChange}
        />
      </div>

      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="mb-4 font-semibold text-[var(--ui-text)]">Preview</h4>
        <div className="aspect-video overflow-hidden rounded-xl bg-[var(--ui-item-bg)]">
          {previewThumbnail ? (
            <img
              src={previewThumbnail}
              alt="Stream preview thumbnail"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-white/70">
              <div className="rounded-2xl bg-black/20 p-3">
                <AppIcon
                  name={state.preset === 'iss-live' ? 'satellite' : 'tv'}
                  className="h-9 w-9"
                />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {state.preset === 'iss-live' ? 'ISS live preset' : 'Stream preview'}
                </div>
                <div className="mt-1 max-w-xs truncate text-xs text-white/50">
                  {activeUrl || ISS_LIVE_URL}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
