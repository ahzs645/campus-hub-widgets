import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'word-of-the-day',
    name: 'Word of the Day',
    description: 'Daily vocabulary with definitions, examples, and etymology',
    icon: 'sparkles',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      category: 'all',
      refreshMode: 'daily',
      cycleInterval: 30,
    },
  },
  load: () => import('./WordOfTheDay'),
  loadOptions: () => import('./WordOfTheDayOptions'),
});
