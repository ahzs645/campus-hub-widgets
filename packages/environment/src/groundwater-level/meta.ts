import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'groundwater-level',
    name: 'Groundwater Level',
    description: 'BC observation well groundwater levels',
    icon: 'droplets',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      locationId: 'OW378',
      datasetId: '',
      displayMode: 'current',
      refreshInterval: 30,
      useCorsProxy: true,
    },
  },
  load: () => import('./GroundwaterLevel'),
  loadOptions: () => import('./GroundwaterLevelOptions'),
});
