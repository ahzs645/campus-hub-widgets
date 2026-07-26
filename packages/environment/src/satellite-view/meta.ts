import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'satellite-view',
    name: 'Satellite View',
    description: 'Sentinel-2 satellite imagery of any location',
    icon: 'globe',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      lat: 53.9171,
      lon: -122.7497,
      zoom: 10,
      year: '2024',
      showLabel: true,
      locationLabel: '',
    },
  },
  load: () => import('./SatelliteView'),
  loadOptions: () => import('./SatelliteViewOptions'),
});
