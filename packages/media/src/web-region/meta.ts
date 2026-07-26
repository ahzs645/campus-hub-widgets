import { defineWidget } from '@firstform/campus-hub-widget-sdk';

export const VIEWPORT_W = 1280;
export const VIEWPORT_H = 800;

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'web-region',
    name: 'Web Region',
    description: 'Embed a cropped region of a website as a live widget',
    icon: 'globe',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{ propName: 'url', types: ['embed'] }],
    defaultProps: {
      url: '',
      refreshInterval: 0,
      regionX: 0,
      regionY: 0,
      regionW: VIEWPORT_W,
      regionH: VIEWPORT_H,
      fit: 'cover',
      useCorsProxy: false,
    },
  },
  load: () => import('./WebRegion'),
  loadOptions: () => import('./WebRegionOptions'),
});
