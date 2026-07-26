import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'cafeteria-menu',
    name: 'Cafeteria Menu',
    description: 'Displays campus cafeteria menu with time-sensitive meals',
    icon: 'utensils',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    acceptsSources: [{
      propName: 'menuUrl',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-cafeteria-menu',
      applySource: (source) => ({
        menuUrl: source.url,
        sourceAdapter: 'unbc-cafeteria-menu',
      }),
    }],
    defaultProps: {
      menuUrl: '',
      danaLocations: '48784',
      refreshInterval: 30,
      weekdayBreakfastStart: '07:00',
      weekdayBreakfastEnd: '10:45',
      weekdayLunchStart: '11:00',
      weekdayLunchEnd: '15:45',
      weekdayDinnerStart: '16:00',
      weekdayDinnerEnd: '23:00',
      weekendBreakfastStart: '08:00',
      weekendBreakfastEnd: '10:45',
      weekendLunchStart: '11:00',
      weekendLunchEnd: '15:45',
      weekendDinnerStart: '16:00',
      weekendDinnerEnd: '22:00',
      useCorsProxy: true,
    },
  },
  load: () => import('./CafeteriaMenu'),
  loadOptions: () => import('./CafeteriaMenuOptions'),
});
