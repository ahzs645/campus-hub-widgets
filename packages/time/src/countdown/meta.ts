import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'countdown',
    name: 'Countdown',
    description: 'Countdown timer with multiple milestones, auto-rotation, and dot indicators',
    icon: 'hourglass',
    minW: 2,
    minH: 2,
    maxW: 7,
    maxH: 5,
    defaultW: 4,
    defaultH: 2,
    defaultProps: {
      milestones: [],
      rotationSeconds: 8,
      hideCompleted: true,
      showYears: 'auto',
      showDays: 'auto',
      showHours: 'auto',
      showMinutes: 'auto',
      showSeconds: 'auto',
      showMilliseconds: 'hide',
    },
  },
  load: () => import('./Countdown'),
  loadOptions: () => import('./CountdownOptions'),
});
