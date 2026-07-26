import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-weather',
    name: 'Dashboard Weather',
    description: 'Classic dashboard weather forecast',
    icon: 'weather',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    tags: ['retro', 'environment'],
    defaultProps: {
      location: 'San Francisco',
      units: 'metric',
      showForecast: true,
    },
  },
  load: () => import('./MacOSWeather'),
  loadOptions: () => import('./MacOSWeatherOptions'),
});
