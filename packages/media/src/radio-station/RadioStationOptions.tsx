'use client';
import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  AppIcon,
} from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

type RadioPlayerMode = 'none' | 'audio' | 'embed';

interface RadioStationOptionsData {
  stationName: string;
  stationTagline: string;
  provider: string;
  metadataUrl: string;
  audioUrl: string;
  embedUrl: string;
  websiteUrl: string;
  artworkUrl: string;
  playerMode: RadioPlayerMode;
  pollIntervalSeconds: number;
  autoplay: boolean;
  showArtwork: boolean;
  showTimestamp: boolean;
  useCorsProxy: boolean;
}

const DEFAULT_STATE: RadioStationOptionsData = {
  stationName: '',
  stationTagline: '',
  provider: '',
  metadataUrl: '',
  audioUrl: '',
  embedUrl: '',
  websiteUrl: '',
  artworkUrl: '',
  playerMode: 'audio',
  pollIntervalSeconds: 20,
  autoplay: false,
  showArtwork: true,
  showTimestamp: true,
  useCorsProxy: false,
};

export default function RadioStationOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<RadioStationOptionsData>({
    ...DEFAULT_STATE,
    stationName: (data?.stationName as string) ?? DEFAULT_STATE.stationName,
    stationTagline: (data?.stationTagline as string) ?? DEFAULT_STATE.stationTagline,
    provider: (data?.provider as string) ?? DEFAULT_STATE.provider,
    metadataUrl: (data?.metadataUrl as string) ?? DEFAULT_STATE.metadataUrl,
    audioUrl: (data?.audioUrl as string) ?? DEFAULT_STATE.audioUrl,
    embedUrl: (data?.embedUrl as string) ?? DEFAULT_STATE.embedUrl,
    websiteUrl: (data?.websiteUrl as string) ?? DEFAULT_STATE.websiteUrl,
    artworkUrl: (data?.artworkUrl as string) ?? DEFAULT_STATE.artworkUrl,
    playerMode: (data?.playerMode as RadioPlayerMode) ?? DEFAULT_STATE.playerMode,
    pollIntervalSeconds: Number(data?.pollIntervalSeconds ?? DEFAULT_STATE.pollIntervalSeconds),
    autoplay: (data?.autoplay as boolean) ?? DEFAULT_STATE.autoplay,
    showArtwork: (data?.showArtwork as boolean) ?? DEFAULT_STATE.showArtwork,
    showTimestamp: (data?.showTimestamp as boolean) ?? DEFAULT_STATE.showTimestamp,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? DEFAULT_STATE.useCorsProxy,
  });

  useEffect(() => {
    setState({
      ...DEFAULT_STATE,
      stationName: (data?.stationName as string) ?? DEFAULT_STATE.stationName,
      stationTagline: (data?.stationTagline as string) ?? DEFAULT_STATE.stationTagline,
      provider: (data?.provider as string) ?? DEFAULT_STATE.provider,
      metadataUrl: (data?.metadataUrl as string) ?? DEFAULT_STATE.metadataUrl,
      audioUrl: (data?.audioUrl as string) ?? DEFAULT_STATE.audioUrl,
      embedUrl: (data?.embedUrl as string) ?? DEFAULT_STATE.embedUrl,
      websiteUrl: (data?.websiteUrl as string) ?? DEFAULT_STATE.websiteUrl,
      artworkUrl: (data?.artworkUrl as string) ?? DEFAULT_STATE.artworkUrl,
      playerMode: (data?.playerMode as RadioPlayerMode) ?? DEFAULT_STATE.playerMode,
      pollIntervalSeconds: Number(data?.pollIntervalSeconds ?? DEFAULT_STATE.pollIntervalSeconds),
      autoplay: (data?.autoplay as boolean) ?? DEFAULT_STATE.autoplay,
      showArtwork: (data?.showArtwork as boolean) ?? DEFAULT_STATE.showArtwork,
      showTimestamp: (data?.showTimestamp as boolean) ?? DEFAULT_STATE.showTimestamp,
      useCorsProxy: (data?.useCorsProxy as boolean) ?? DEFAULT_STATE.useCorsProxy,
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const normalizedValue =
      name === 'pollIntervalSeconds'
        ? Math.max(10, Math.min(300, Number(value) || DEFAULT_STATE.pollIntervalSeconds))
        : value;

    const nextState = { ...state, [name]: normalizedValue };
    setState(nextState);
    onChange(nextState);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Station Identity</h3>

        <FormInput
          label="Station Name"
          name="stationName"
          type="text"
          value={state.stationName}
          placeholder="CFUR 88.7 FM"
          onChange={handleChange}
        />

        <FormInput
          label="Tagline"
          name="stationTagline"
          type="text"
          value={state.stationTagline}
          placeholder="Community-Campus Radio"
          onChange={handleChange}
        />

        <FormInput
          label="Provider Label"
          name="provider"
          type="text"
          value={state.provider}
          placeholder="CFUR / iHeartRadio"
          onChange={handleChange}
        />

        <FormInput
          label="Artwork URL"
          name="artworkUrl"
          type="url"
          value={state.artworkUrl}
          placeholder="https://example.com/station-art.png"
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Data & Playback</h3>

        <FormInput
          label="Metadata API URL"
          name="metadataUrl"
          type="url"
          value={state.metadataUrl}
          placeholder="https://ca.api.iheart.com/api/v3/live-meta/stream/..."
          onChange={handleChange}
        />

        <FormInput
          label="Audio Stream URL"
          name="audioUrl"
          type="url"
          value={state.audioUrl}
          placeholder="https://listen.example.com/mp3"
          onChange={handleChange}
        />

        <FormInput
          label="Embed Player URL"
          name="embedUrl"
          type="url"
          value={state.embedUrl}
          placeholder="https://www.iheart.com/live/station/?embed=true"
          onChange={handleChange}
        />

        <FormInput
          label="Station Website URL"
          name="websiteUrl"
          type="url"
          value={state.websiteUrl}
          placeholder="https://station.example.com/listen"
          onChange={handleChange}
        />

        <FormSelect
          label="Player Mode"
          name="playerMode"
          value={state.playerMode}
          options={[
            { value: 'audio', label: 'Audio Button' },
            { value: 'embed', label: 'Embedded Player' },
            { value: 'none', label: 'Metadata Only' },
          ]}
          onChange={handleChange}
        />

        <FormInput
          label="Poll Interval (seconds)"
          name="pollIntervalSeconds"
          type="number"
          value={String(state.pollIntervalSeconds)}
          placeholder="20"
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          The CFUR iHeart endpoint is browser-accessible and typically updates every 15 to 30 seconds when metadata is available.
        </div>
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Display Options</h3>

        <FormSwitch
          label="Show Artwork"
          name="showArtwork"
          checked={state.showArtwork}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Last Updated Time"
          name="showTimestamp"
          checked={state.showTimestamp}
          onChange={handleChange}
        />

        <FormSwitch
          label="Autoplay Audio"
          name="autoplay"
          checked={state.autoplay}
          onChange={handleChange}
        />

        <FormSwitch
          label="Use CORS Proxy for Metadata"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </div>

      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="mb-4 font-semibold text-[var(--ui-text)]">Preview</h4>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#08131f_0%,#11283d_55%,#1c3c5d_100%)] p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {state.showArtwork && state.artworkUrl ? (
                <img src={state.artworkUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <AppIcon name="music" className="h-8 w-8 text-white/80" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                {state.provider || 'Radio Station'}
              </div>
              <div className="truncate text-lg font-semibold">
                {state.stationName || 'Station name'}
              </div>
              <div className="truncate text-sm text-white/65">
                {state.stationTagline || 'Current track metadata will appear here'}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 text-sm text-white/70">
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-100">
              {state.playerMode === 'embed' ? 'Embedded player' : state.playerMode === 'audio' ? 'Audio button' : 'Metadata only'}
            </span>
            <span>Poll every {state.pollIntervalSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
