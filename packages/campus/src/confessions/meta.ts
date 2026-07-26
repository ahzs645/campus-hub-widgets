import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'confessions',
    name: 'Confessions',
    description: 'UNBC confessions from overtheedge.unbc.ca',
    icon: 'newspaper',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-confessions',
      applySource: (source) => ({
        apiUrl: source.url,
        sourceAdapter: 'unbc-confessions',
      }),
    }],
    defaultProps: {
      apiUrl: '',
      pageUrl: '',
      maxItems: 10,
      rotationSeconds: 12,
      cacheTtlSeconds: 300,
      batchRefreshMinutes: 15,
      useCorsProxy: false,
      showByline: true,
    },
  },
  load: () => import('./Confessions'),
  loadOptions: () => import('./ConfessionsOptions'),
});
