import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'bottle-spin',
    name: 'Bottle Spin',
    description: 'Auto-spinning bottle animation',
    icon: 'wine',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: { spinInterval: 30 },
  },
  load: () => import('./BottleSpin'),
  loadOptions: () => import('./BottleSpinOptions'),
});
