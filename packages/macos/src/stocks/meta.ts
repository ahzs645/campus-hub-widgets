import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'macos-stocks',
    name: 'macOS Stocks',
    description: 'Aqua-style stock tape with quotes and trend chart',
    icon: 'coins',
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 3,
    tags: ['retro', 'info'],
    defaultProps: {
      symbols: 'AAPL,MSFT,NVDA,GOOG',
      range: '6mo',
    },
  },
  load: () => import('./MacOSStocks'),
  loadOptions: () => import('./MacOSStocksOptions'),
});
