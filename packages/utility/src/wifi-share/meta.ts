import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'wifi-share',
    name: 'WiFi Share',
    description: 'Share your WiFi network via QR code with customizable display',
    icon: 'wifi',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 4,
    defaultProps: {
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false,
      message: 'Scan to Connect to WiFi!',
      showNetworkName: true,
      showPassword: true,
      bgColor: '',
      textColor: '',
      qrFgColor: '',
      qrBgColor: '',
    },
  },
  load: () => import('./WiFiShare'),
  loadOptions: () => import('./WiFiShareOptions'),
});
