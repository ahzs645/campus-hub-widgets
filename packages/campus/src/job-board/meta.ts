import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'job-board',
    name: 'Job Board',
    description: 'Campus job postings with optional QR code link',
    icon: 'newspaper',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api', 'feed'],
      applySource: (source) => ({
        apiUrl: source.url,
        sourceType: source.sourceType === 'feed' ? 'rss' : 'json',
      }),
    }],
    defaultProps: {
      maxItems: 10,
      label: 'Campus Jobs',
      sourceType: 'json',
      cacheTtlSeconds: 120,
      displayMode: 'scroll',
      rotationSeconds: 5,
      speed: 35,
      qrEnabled: false,
      qrUrl: '',
      qrLabel: 'Scan to apply',
      useCorsProxy: true,
    },
  },
  load: () => import('./JobBoard'),
  loadOptions: () => import('./JobBoardOptions'),
});
