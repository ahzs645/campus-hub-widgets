import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'clock',
    name: 'Clock',
    description: 'Displays current time and date',
    icon: 'clock',
    minW: 2,
    minH: 1,
    maxW: 8,
    maxH: 4,
    defaultW: 3,
    defaultH: 1,
    defaultProps: {
      showSeconds: false,
      showDate: true,
      format24h: false,
      alignment: 'right',
      verticalAlignment: 'top',
      style: 'digital',
      customFormat: '',
    },
  },
  load: () => import('./Clock'),
  loadOptions: () => import('./ClockOptions'),
});
