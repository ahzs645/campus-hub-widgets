import { defineWidget } from '@firstform/campus-hub-widget-sdk';

export const DEFAULT_URL =
  'https://www.gasbuddy.com/gasprices/british-columbia/prince-george';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'gas-prices',
    name: 'Gas Prices',
    description: 'Display average gas prices from GasBuddy for Prince George, BC',
    icon: 'flame',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 4,
    defaultProps: {
      url: DEFAULT_URL,
      refreshInterval: 30,
      useCorsProxy: true,
      maxStations: 10,
    },
  },
  load: () => import('./GasPrices'),
  loadOptions: () => import('./GasPricesOptions'),
});
