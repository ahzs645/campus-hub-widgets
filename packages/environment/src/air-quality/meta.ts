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
    acceptsSources: [{
      propName: 'apiUrl', types: ['api'], requires: { format: ['html'] },
      capabilityHint: 'BC AQHI page containing a current air quality reading.',
      applySource: (source) => ({ apiUrl: source.url, dataSource: 'bc-aqhi' }),
      removeSource: () => ({ apiUrl: '', waqiToken: '' }),
    }],
    defaultProps: {
      apiUrl: '',
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

