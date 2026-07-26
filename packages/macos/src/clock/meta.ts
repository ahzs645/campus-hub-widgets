import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-clock',
    name: 'Dashboard Clock',
    description: 'Classic dashboard analog clock',
    icon: 'clock',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2,
    tags: ['retro', 'time'],
    defaultProps: {
      timezone: '',
      cityLabel: '',
      showSeconds: true,
      showDigital: true,
    },
  },
  load: () => import('./MacOSClock'),
  loadOptions: () => import('./MacOSClockOptions'),
});
