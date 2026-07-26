import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'news-ticker',
    name: 'News Ticker',
    description: 'Scrolling announcements and alerts',
    icon: 'megaphone',
    minW: 4,
    minH: 1,
    // Banner ticker designed for a single ~70px row; cap height so it can't be
    // stretched tall (content scales by containerHeight/70 and would balloon).
    maxH: 1,
    defaultW: 12,
    defaultH: 1,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api', 'feed'],
      applySource: (source) => ({
        apiUrl: source.url,
        sourceType: source.sourceType === 'feed' ? 'rss' : 'json',
      }),
    }],
    defaultProps: {
      speed: 30,
      scale: 1,
      label: 'Breaking',
      dataSource: 'announcements',
      sourceType: 'json',
      cacheTtlSeconds: 120,
      templateCityName: 'SimCity',
      templateMayorName: 'Mayor Sim',
      templateRandomSimName: '',
      templateRandomWorkplaceName: '',
      templateSim: 'Sim',
      templateSims: 'Sims',
      simcityCategories: '',
      simcityMaxItems: 40,
      useCorsProxy: true,
      eventSourceType: 'json',
      eventCacheTtlSeconds: 300,
      eventMaxItems: 10,
    },
  },
  load: () => import('./NewsTicker'),
  loadOptions: () => import('./NewsTickerOptions'),
});
