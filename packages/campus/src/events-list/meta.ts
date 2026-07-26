import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'events-list',
    name: 'Events List',
    description: 'Display upcoming campus events',
    icon: 'calendar',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
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
      maxItems: 10,
      title: 'Upcoming Events',
      sourceType: 'json',
      cacheTtlSeconds: 300,
      displayMode: 'scroll',
      rotationSeconds: 5,
      useCorsProxy: true,
    },
  },
  load: () => import('./EventsList'),
  loadOptions: () => import('./EventsListOptions'),
});
