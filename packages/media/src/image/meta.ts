import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'image',
    name: 'Image',
    description: 'Display a static image',
    icon: 'image',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{ propName: 'url', types: ['image'] }],
    defaultProps: {
      url: '',
      alt: 'Image',
      fit: 'cover',
    },
  },
  load: () => import('./Image'),
  loadOptions: () => import('./ImageOptions'),
});
