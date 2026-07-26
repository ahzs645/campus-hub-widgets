import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'web',
    name: 'Web Embed',
    description: 'Embed external web content',
    icon: 'globe',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{ propName: 'url', types: ['embed'] }],
    defaultProps: {
      url: '',
      refreshInterval: 0,
    },
  },
  load: () => import('./Web'),
  loadOptions: () => import('./WebOptions'),
});
