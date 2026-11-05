import { defineWidget } from '@firstform/campus-hub-widget-sdk';

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
    acceptsSources: [{
      propName: 'url', types: ['api'], requires: { format: ['html'] },
      capabilityHint: 'GasBuddy location page with current station prices.',
    }],
    defaultProps: {
      url: '',
      refreshInterval: 30,
      useCorsProxy: true,
      maxStations: 10,
    },
  },
  load: () => import('./GasPrices'),
  loadOptions: () => import('./GasPricesOptions'),
});

