import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'climbing-gym',
    name: 'Climbing Gym',
    description: 'Live occupancy counter for a climbing gym via Rock Gym Pro',
    icon: 'mountain',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 2,
    acceptsSources: [{
      propName: 'portalUrl',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'rock-gym-pro-occupancy',
      applySource: (source) => ({
        portalUrl: source.url,
        sourceAdapter: 'rock-gym-pro-occupancy',
      }),
    }],
    defaultProps: {
      gymName: 'OVERhang',
      portalUrl: '',
      refreshInterval: 5,
      showCapacityBar: true,
      showHours: true,
      useCorsProxy: true,
    },
  },
  load: () => import('./ClimbingGym'),
  loadOptions: () => import('./ClimbingGymOptions'),
});
