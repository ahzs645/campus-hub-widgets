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
    defaultProps: {
      baseCurrency: 'USD',
      currencies: ['EUR', 'GBP', 'JPY', 'INR'],
      cycleInterval: 10,
      amount: 1,
    },
  },
  load: () => import('./ExchangeRate'),
  loadOptions: () => import('./ExchangeRateOptions'),
});
