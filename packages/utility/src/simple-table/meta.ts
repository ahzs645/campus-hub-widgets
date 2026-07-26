import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'simple-table',
    name: 'Simple Table',
    description: 'Display tabular data from CSV or manual entry',
    icon: 'table',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{
      propName: 'csvUrl',
      types: ['api'],
      capabilityHint: 'Expects CSV or plain-text tabular data; the first row becomes the column headers.',
      applySource: (source) => ({
        csvUrl: source.url,
        source: 'url',
      }),
    }],
    defaultProps: {
      source: 'manual',
      csvUrl: '',
      manualData: '',
      title: '',
      headerStyle: 'accent',
      striped: true,
      refreshInterval: 30,
      useCorsProxy: true,
      autoScroll: true,
      scrollSpeed: 40,
    },
  },
  load: () => import('./SimpleTable'),
  loadOptions: () => import('./SimpleTableOptions'),
});
