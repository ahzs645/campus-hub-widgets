import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'fire-hazard',
    name: 'Fire Hazard Rating',
    description: 'BC Wildfire danger class rating by fire centre',
    icon: 'flame',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      fireCentre: 'Cariboo Fire Centre',
      refreshInterval: 30,
      useCorsProxy: true,
    },
  },
  load: () => import('./FireHazard'),
  loadOptions: () => import('./FireHazardOptions'),
});
