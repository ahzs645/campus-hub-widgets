import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'group-fitness',
    name: 'Group Fitness',
    description: 'UNBC Northern Sport Centre drop-in fitness schedule by day or by class',
    icon: 'calendar',
    minW: 4,
    minH: 3,
    maxW: 8,
    maxH: 6,
    defaultW: 5,
    defaultH: 4,
    acceptsSources: [{
      propName: 'scheduleUrl',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-group-fitness',
      applySource: (source) => ({
        scheduleUrl: source.url,
        sourceAdapter: 'unbc-group-fitness',
      }),
    }],
    defaultProps: {
      title: 'Group Fitness',
      scheduleUrl: '',
      viewMode: 'day',
      selectedDay: 'today',
      selectedClass: '',
      refreshInterval: 60,
      showSemester: true,
      showInstructor: true,
      showDescription: true,
      maxRows: 6,
      useCorsProxy: true,
    },
  },
  load: () => import('./GroupFitness'),
  loadOptions: () => import('./GroupFitnessOptions'),
});
