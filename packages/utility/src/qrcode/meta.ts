import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'qrcode',
    name: 'QR Code',
    description: 'Generate and display a QR code from text or a URL',
    icon: 'qrCode',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      text: '',
      label: '',
      fgColor: '',
      bgColor: '',
      errorCorrection: 'M',
    },
  },
  load: () => import('./QRCode'),
  loadOptions: () => import('./QRCodeOptions'),
});
