import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'time-progress',
    name: 'Time Progress',
    description: 'Day, week, month & year progress',
    icon: 'hourglass',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 2,
    defaultProps: { displayMode: 'dots', showLabels: true },
  },
  load: () => import('./TimeProgress'),
  loadOptions: () => import('./TimeProgressOptions'),
});
