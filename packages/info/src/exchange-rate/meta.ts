import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'exchange-rate',
    name: 'Exchange Rate',
    description: 'Live currency exchange rates',
    icon: 'arrowLeftRight',
    minW: 2,
    minH: 1,
    defaultW: 3,
    defaultH: 1,
    acceptsSources: [{
      propName: 'apiUrl', types: ['api'], requires: { format: ['json'] },
      capabilityHint: 'Currency rates JSON with rates and a base currency.',
      removeSource: () => ({ apiUrl: '' }),
    }],
    defaultProps: { apiUrl: '',
      baseCurrency: 'USD',
      currencies: ['EUR', 'GBP', 'JPY', 'INR'],
      cycleInterval: 10,
      amount: 1,
    },
  },
  load: () => import('./ExchangeRate'),
  loadOptions: () => import('./ExchangeRateOptions'),
});

