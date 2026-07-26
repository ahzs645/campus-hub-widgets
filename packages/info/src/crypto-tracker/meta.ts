import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'crypto-tracker',
    name: 'Crypto Tracker',
    description: 'Live cryptocurrency prices',
    icon: 'coins',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: {
      coins: ['bitcoin', 'ethereum', 'solana'],
      cycleInterval: 10,
      showSparkline: true,
    },
  },
  load: () => import('./CryptoTracker'),
  loadOptions: () => import('./CryptoTrackerOptions'),
});
