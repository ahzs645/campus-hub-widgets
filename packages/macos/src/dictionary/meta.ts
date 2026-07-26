import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-dictionary',
    name: 'macOS Dictionary',
    description: 'Aqua-style dictionary and synonym lookup',
    icon: 'type',
    minW: 3,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    tags: ['retro', 'info'],
    defaultProps: {
      initialWord: 'serendipity',
      showExamples: true,
    },
  },
  load: () => import('./MacOSDictionary'),
  loadOptions: () => import('./MacOSDictionaryOptions'),
});
