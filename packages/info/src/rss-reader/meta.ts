import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'rss-reader',
    name: 'RSS Reader',
    description: 'Display RSS or Atom feed content',
    icon: 'rss',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 4,
    acceptsSources: [{ propName: 'feedUrl', types: ['feed'] }],
    defaultProps: {
      feedUrl: '',
      maxItems: 10,
      refreshInterval: 15,
      showDescription: true,
      showDate: true,
      scrollSpeed: 40,
      title: '',
      useCorsProxy: true,
    },
  },
  load: () => import('./RSSReader'),
  loadOptions: () => import('./RSSReaderOptions'),
});
