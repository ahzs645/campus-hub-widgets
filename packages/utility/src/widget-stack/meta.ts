import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'widget-stack',
    name: 'Widget Stack',
    description: 'Cycle through multiple widgets with stack, carousel, or fade animations',
    icon: 'layers',
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    defaultProps: {
      rotationSeconds: 8,
      animationMode: 'fade',
      children: [],
    },
  },
  load: () => import('./WidgetStack'),
  loadOptions: () => import('./WidgetStackOptions'),
});
