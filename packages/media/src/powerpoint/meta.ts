import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'powerpoint',
    name: 'PowerPoint',
    description: 'Embed Microsoft PowerPoint presentations from Office on the web or public .pptx files',
    icon: 'slideshow',
    minW: 4,
    minH: 3,
    defaultW: 7,
    defaultH: 4,
    acceptsSources: [{ propName: 'url', types: ['powerpoint'] }],
    defaultProps: {
      url: '',
      refreshInterval: 0,
      showTitle: false,
      title: '',
    },
  },
  load: () => import('./PowerPoint'),
  loadOptions: () => import('./PowerPointOptions'),
});
