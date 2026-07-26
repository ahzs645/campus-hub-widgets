import { defineWidget } from '@firstform/campus-hub-widget-sdk';

export const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'SPY'];

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'stock-quotes',
    name: 'Stock Quotes',
    description: 'Track multiple stock symbols with a lead trend chart.',
    icon: 'arrowLeftRight',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
    defaultProps: {
      title: 'Stock Quotes',
      symbols: DEFAULT_SYMBOLS,
      chartSymbol: 'NVDA',
      range: '6mo',
      refreshInterval: 10,
      showChart: true,
      showChange: true,
      showNames: true,
    },
  },
  load: () => import('./StockQuotes'),
  loadOptions: () => import('./StockQuotesOptions'),
});
