import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'youtube',
    name: 'YouTube',
    description: 'Embed YouTube videos',
    icon: 'brandYoutube',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{ propName: 'videoId', types: ['video'] }],
    defaultProps: {
      videoId: '',
      autoplay: false,
      muted: true,
      loop: true,
    },
  },
  load: () => import('./YouTube'),
  loadOptions: () => import('./YouTubeOptions'),
});
