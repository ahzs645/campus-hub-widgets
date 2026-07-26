import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'stream-player',
    name: 'Stream Player',
    description: 'Universal player for live feeds, YouTube channels, HLS, direct media, and embeds',
    icon: 'satellite',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [
      { propName: 'url', types: ['video', 'embed', 'youtube', 'vimeo', 'google-drive'] },
      { propName: 'fallbackUrl', types: ['video', 'embed', 'youtube', 'vimeo', 'google-drive'] },
    ],
    defaultProps: {
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
    },
  },
  load: () => import('./StreamPlayer'),
  loadOptions: () => import('./StreamPlayerOptions'),
});
