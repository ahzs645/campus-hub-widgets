import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'media-player',
    name: 'Media Player',
    description: 'Play video or audio files',
    icon: 'film',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{ propName: 'url', types: ['video'] }],
    defaultProps: {
      url: '',
      type: 'video',
      autoplay: false,
      muted: true,
      loop: true,
      controls: true,
    },
  },
  load: () => import('./MediaPlayer'),
  loadOptions: () => import('./MediaPlayerOptions'),
});
