import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'holiday-calendar',
    name: 'Holiday Calendar',
    description: 'Daily holiday celebrations',
    icon: 'partyPopper',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: { style: 'modern' },
  },
  load: () => import('./HolidayCalendar'),
  loadOptions: () => import('./HolidayCalendarOptions'),
});
