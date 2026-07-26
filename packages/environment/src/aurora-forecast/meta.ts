import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'aurora-forecast',
    name: 'Aurora Forecast',
    description: 'Northern lights visibility forecast from NOAA space weather data',
    icon: 'sparkles',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      refreshInterval: 15,
      latitude: 54,
      useCorsProxy: true,
    },
  },
  load: () => import('./AuroraForecast'),
  loadOptions: () => import('./AuroraForecastOptions'),
});
