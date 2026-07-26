import { defineWidget } from '@firstform/campus-hub-widget-sdk';

export const DEFAULT_CITY = 'Prince George, BC, Canada';
export const DEFAULT_LATITUDE = 53.9171;
export const DEFAULT_LONGITUDE = -122.7497;
export const DEFAULT_WEATHER_NETWORK_URL = 'https://www.theweathernetwork.com/en/city/ca/british-columbia/prince-george/uv';
export const DEFAULT_REFRESH_MINUTES = 30;

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'uv-index',
    name: 'UV Index',
    description: 'Display current UV index with sun protection advice',
    icon: 'sun',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      dataSource: 'openuv',
      openUvApiKey: '',
      locationMode: 'city',
      city: DEFAULT_CITY,
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
      waqiToken: '',
      waqiCity: 'prince-george',
      weatherNetworkUrl: DEFAULT_WEATHER_NETWORK_URL,
      refreshInterval: DEFAULT_REFRESH_MINUTES,
    },
  },
  load: () => import('./UvIndex'),
  loadOptions: () => import('./UvIndexOptions'),
});
