import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'kaomoji',
    name: 'Kaomoji',
    description: 'Cycling Japanese emoticons',
    icon: 'smile',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2,
    defaultProps: { cycleInterval: 5 },
  },
  load: () => import('./Kaomoji'),
  loadOptions: () => import('./KaomojiOptions'),
});
