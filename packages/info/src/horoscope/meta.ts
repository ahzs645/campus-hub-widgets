import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'horoscope',
    name: 'Daily Horoscope',
    description: 'A sign-specific daily horoscope with lucky details.',
    icon: 'sparkles',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2,
    defaultProps: {
      sign: 'Aries',
      title: 'Daily Horoscope',
      showLucky: true,
      showTraits: true,
      tone: 'balanced',
    },
  },
  load: () => import('./Horoscope'),
  loadOptions: () => import('./HoroscopeOptions'),
});
