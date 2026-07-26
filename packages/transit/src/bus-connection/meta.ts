import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Bus Connection widget declaration.
 *
 * This module is loaded by every host that reads the widget catalogue, so it
 * must stay free of component and library imports. The display component pulls
 * in gtfs-realtime-bindings, fflate and react-pixel-display; keeping those
 * behind `load` is what stops a board with no bus widget from downloading a
 * protobuf runtime and an LED-matrix renderer.
 */
export default defineWidget({
  manifest: {
    type: 'bus-connection',
    name: 'Bus Connection',
    description: 'Live bus arrival display for UNBC Exchange',
    icon: 'bus',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 2,
    defaultProps: {
      glow: true,
      scrollHeadsigns: true,
      departureTimeOnly: false,
      hideStationPrefix: false,
      pixelPitch: 6,
      padding: 8,
      entrySpacing: 2,
      proxyUrl: '',
      simulate: false,
      simMode: 'weekday',
      simTime: 540,
      useCorsProxy: true,
    },
  },
  load: () => import('./BusConnection'),
  loadOptions: () => import('./BusConnectionOptions'),
});
