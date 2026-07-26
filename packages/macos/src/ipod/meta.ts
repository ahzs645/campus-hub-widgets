import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-ipod',
    name: 'macOS iPod',
    description: 'Aqua-era iPod mini player with cover art and playback controls',
    icon: 'music',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
    tags: ['retro', 'media'],
    defaultProps: {
      title: 'Campus Groove',
      artist: 'Campus Hub',
      album: 'Aqua Mix',
      audioUrl: '',
      coverUrl: '',
      accentColor: '#70b86c',
    },
  },
  load: () => import('./MacOSIPod'),
  loadOptions: () => import('./MacOSIPodOptions'),
});
