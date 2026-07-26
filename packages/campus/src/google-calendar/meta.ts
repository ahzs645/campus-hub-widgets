import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'google-calendar',
    name: 'Google Calendar',
    description: 'Display events from Google Calendar',
    icon: 'brandGoogleCalendar',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 4,
    acceptsSources: [{ propName: 'calendarId', types: ['calendar'] }],
    defaultProps: {
      calendarId: '',
      apiKey: '',
      maxEvents: 10,
      refreshInterval: 15,
      showLocation: true,
      daysAhead: 7,
      title: '',
    },
  },
  load: () => import('./GoogleCalendar'),
  loadOptions: () => import('./GoogleCalendarOptions'),
});
