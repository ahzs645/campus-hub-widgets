import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';
import type { RadioPlayerMode } from './RadioStation';

export function clampPollInterval(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(10, Math.min(300, Math.round(value as number)));
}

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'radio-station',
    name: 'Radio Station',
    description: 'Show now-playing metadata for a live radio station with optional playback.',
    icon: 'music',
    minW: 4,
    minH: 2,
    defaultW: 6,
    defaultH: 3,
    defaultProps: {
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
    },
    acceptsSources: [
      { propName: 'audioUrl', types: ['video'] },
      { propName: 'embedUrl', types: ['embed'] },
      {
        propName: 'metadataUrl',
        removeSource: () => ({ audioUrl: '', embedUrl: '', websiteUrl: '', artworkUrl: '' }),
        types: ['api'],
        matchSource: (source) =>
          resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'radio-now-playing',
        applySource: (source, currentData) => {
          return {
            metadataUrl: source.url,
            sourceAdapter: 'radio-now-playing',
            stationName: source.name,
            stationTagline: source.description ?? '',
            provider: source.metadata?.provider ?? '',
            artworkUrl: source.metadata?.thumbnailUrl ?? '',
            audioUrl: source.metadata?.audioUrl ?? '',
            embedUrl: source.metadata?.embedUrl ?? '',
            websiteUrl: source.metadata?.websiteUrl ?? '',
            pollIntervalSeconds: clampPollInterval(
              currentData.pollIntervalSeconds as number | undefined
            ),
            playerMode: (currentData.playerMode as RadioPlayerMode | undefined) ?? 'audio',
            useCorsProxy: false,
          };
        },
      },
    ],
  },
  load: () => import('./RadioStation'),
  loadOptions: () => import('./RadioStationOptions'),
});

