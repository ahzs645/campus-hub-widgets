import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-calendar',
    name: 'macOS Calendar',
    description: 'Aqua-style month view with upcoming events',
    icon: 'calendarRange',
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 3,
    tags: ['retro', 'campus'],
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api', 'calendar', 'feed'],
      applySource: (source) => ({
        apiUrl: source.url,
        sourceType:
          source.sourceType === 'calendar'
            ? 'ical'
            : source.sourceType === 'feed'
              ? 'rss'
              : 'json',
      }),
    }],
    defaultProps: {
      title: 'Calendar',
      apiUrl: '',
      sourceType: 'ical',
      maxItems: 6,
      layoutMode: 'auto',
    },
  },
  load: () => import('./MacOSCalendar'),
  loadOptions: () => import('./MacOSCalendarOptions'),
});
