import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';
import type { RadioPlayerMode } from './RadioStation';

export const CFUR_ARTWORK_URL = 'https://i.iheart.com/v3/re/new_assets/621cef9099212de025af8a9d';
export const CFUR_STREAM_URL = 'https://listen.cfur.ca/mp3';
export const CFUR_EMBED_URL = 'https://www.iheart.com/live/cfur-9357/?embed=true';
export const CFUR_WEBSITE_URL = 'https://cfur.ca/listen-live';
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
      stationName: 'CFUR 88.7 FM',
      stationTagline: 'Community-Campus Radio',
      provider: '',
      metadataUrl: '',
      audioUrl: '',
      embedUrl: '',
      websiteUrl: '',
      artworkUrl: CFUR_ARTWORK_URL,
      playerMode: 'audio',
      pollIntervalSeconds: 20,
      autoplay: false,
      showArtwork: true,
      showTimestamp: true,
      useCorsProxy: false,
    },
    acceptsSources: [
      {
        propName: 'metadataUrl',
        types: ['api'],
        matchSource: (source) =>
          resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'radio-now-playing',
        applySource: (source, currentData) => {
          const isCFUR = source.url.includes('/stream/9357/currentTrackMeta');
          return {
            metadataUrl: source.url,
            sourceAdapter: 'radio-now-playing',
            stationName: isCFUR ? 'CFUR 88.7 FM' : source.name,
            stationTagline: isCFUR
              ? 'Community-Campus Radio'
              : (currentData.stationTagline as string | undefined) ?? source.description ?? '',
            provider: source.metadata?.provider ?? (currentData.provider as string | undefined) ?? '',
            artworkUrl:
              source.metadata?.thumbnailUrl ??
              (isCFUR ? CFUR_ARTWORK_URL : ((currentData.artworkUrl as string | undefined) ?? '')),
            audioUrl: isCFUR ? CFUR_STREAM_URL : ((currentData.audioUrl as string | undefined) ?? ''),
            embedUrl: isCFUR ? CFUR_EMBED_URL : ((currentData.embedUrl as string | undefined) ?? ''),
            websiteUrl: isCFUR ? CFUR_WEBSITE_URL : ((currentData.websiteUrl as string | undefined) ?? ''),
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
