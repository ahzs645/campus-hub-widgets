import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'iss-tracker',
    name: 'ISS Tracker',
    description: 'Real-time ISS position tracker',
    icon: 'satellite',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 4,
    defaultW: 3,
    defaultH: 2,
    defaultProps: { refreshInterval: 1, showMap: true },
  },
  load: () => import('./ISSTracker'),
  loadOptions: () => import('./ISSTrackerOptions'),
});
