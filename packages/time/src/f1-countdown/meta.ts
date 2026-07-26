import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'f1-countdown',
    name: 'F1 Countdown',
    description: 'Countdown to next F1 race',
    icon: 'flag',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 4,
    defaultW: 3,
    defaultH: 2,
    defaultProps: { showSessions: true },
  },
  load: () => import('./F1Countdown'),
  loadOptions: () => import('./F1CountdownOptions'),
});
