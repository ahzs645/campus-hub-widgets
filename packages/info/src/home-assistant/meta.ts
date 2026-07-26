import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'home-assistant',
    name: 'Home Assistant',
    description: 'Display live Home Assistant entity data — sensors, 3D printers, media players, cameras, and more',
    icon: 'brandHomeAssistant',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 8,
    defaultW: 3,
    defaultH: 3,
    tags: ['iot', 'smart-home', 'sensors'],
    defaultProps: {
      mode: 'signaling',
      signalUrl: '',
      displayId: '',
      httpUrl: '',
      pollIntervalSeconds: 30,
      entityIds: [],
      layout: 'auto',
    },
  },
  load: () => import('./HomeAssistant'),
  loadOptions: () => import('./HomeAssistantOptions'),
});
