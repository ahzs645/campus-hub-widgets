import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'calendar',
    name: 'Calendar',
    description: 'Show upcoming events from iCal, Google Calendar, or any calendar URL',
    icon: 'calendarRange',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 4,
    acceptsSources: [{ propName: 'calendarUrl', types: ['calendar'] }],
    defaultProps: {
      calendarUrl: '',
      sourceFormat: 'ical',
      maxEvents: 10,
      refreshInterval: 15,
      showLocation: true,
      daysAhead: 7,
      title: '',
      useCorsProxy: true,
    },
  },
  load: () => import('./Calendar'),
  loadOptions: () => import('./CalendarOptions'),
});
