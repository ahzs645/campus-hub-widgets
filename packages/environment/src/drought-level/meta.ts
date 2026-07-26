import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'drought-level',
    name: 'Drought Level',
    description: 'BC provincial drought level by water basin',
    icon: 'cloudOff',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      basin: '',
      displayMode: 'single',
      refreshInterval: 60,
      useCorsProxy: true,
    },
  },
  load: () => import('./DroughtLevel'),
  loadOptions: () => import('./DroughtLevelOptions'),
});
