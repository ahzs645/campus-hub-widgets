import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'sunset-sunrise',
    name: 'Sunset / Sunrise',
    description: 'Display local sunset and sunrise times',
    icon: 'sunrise',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2,
    defaultProps: {
      latitude: 48.8566,
      longitude: 2.3522,
      locationName: 'Paris',
      timeFormat: '12h',
      showDetails: true,
      refreshInterval: 30,
    },
  },
  load: () => import('./SunsetSunrise'),
  loadOptions: () => import('./SunsetSunriseOptions'),
});
