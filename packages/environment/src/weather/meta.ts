import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';
import type { DisplayItems, DisplayMode } from './Weather';

export const DISPLAY_MODE_PRESETS: Record<Exclude<DisplayMode, 'custom'>, DisplayItems> = {
  full: {
    location: true, icon: true, temperature: true, condition: true,
    humidity: true, wind: true, pressure: true, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: true,
  },
  'temperature-only': {
    location: true, icon: true, temperature: true, condition: true,
    humidity: false, wind: false, pressure: false, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: false,
  },
  'wind-only': {
    location: true, icon: false, temperature: false, condition: false,
    humidity: false, wind: true, pressure: false, dewPoint: false,
    windGust: true, precipitation: false, lastUpdated: false,
  },
  minimal: {
    location: false, icon: true, temperature: true, condition: false,
    humidity: false, wind: false, pressure: false, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: false,
  },
};
export const GEOMET_PRINCE_GEORGE_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/bc-79?f=json&lang=en';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'weather',
    name: 'Weather',
    description: 'Display current weather conditions',
    icon: 'weather',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 2,
    defaultProps: {
      location: 'Campus',
      units: 'fahrenheit',
      showDetails: true,
      displayMode: 'full',
      displayItems: DISPLAY_MODE_PRESETS.full,
      apiKey: '',
      apiUrl: GEOMET_PRINCE_GEORGE_URL,
      dataSource: 'openweathermap',
      refreshInterval: 10,
      useCorsProxy: true,
      appearance: 'default',
    },
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api'],
      matchSource: (source) => {
        const adapter = resolveSourceAdapter({ url: source.url, presetId: source.presetId });
        return adapter?.id === 'unbc-rooftop-weather'
          || adapter?.id === 'msc-geomet-weather';
      },
      applySource: (source, currentData) => {
        const candidate = resolveSourceAdapter({ url: source.url, presetId: source.presetId });
        return {
          apiUrl: source.url,
          dataSource: candidate ? 'source' : 'msc-geomet',
          sourceAdapter: candidate?.id,
          location: source.name,
          useCorsProxy: source.url.includes('api.weather.gc.ca')
            ? false
            : (currentData.useCorsProxy as boolean | undefined) ?? true,
        };
      },
    }],
  },
  load: () => import('./Weather'),
  loadOptions: () => import('./WeatherOptions'),
});
