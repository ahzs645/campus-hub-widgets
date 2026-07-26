import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'fortune-cookie',
    name: 'Fortune Cookie',
    description: 'Cracks open on a set interval to reveal a new fortune',
    icon: 'sparkles',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: {
      openInterval: 20,
    },
  },
  load: () => import('./FortuneCookie'),
  loadOptions: () => import('./FortuneCookieOptions'),
});
