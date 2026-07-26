import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'canva',
    name: 'Canva',
    description: 'Display Canva designs directly on your screens via smart embed link',
    icon: 'brandCanva',
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
  load: () => import('./Canva'),
  loadOptions: () => import('./CanvaOptions'),
});
