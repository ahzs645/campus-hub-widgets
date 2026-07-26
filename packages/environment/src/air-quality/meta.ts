import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'air-quality',
    name: 'Air Quality',
    description: 'Display current air quality index',
    icon: 'wind',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      dataSource: 'waqi',
      waqiToken: '',
      waqiCity: 'prince-george',
      refreshInterval: 15,
      useCorsProxy: true,
    },
  },
  load: () => import('./AirQuality'),
  loadOptions: () => import('./AirQualityOptions'),
});
