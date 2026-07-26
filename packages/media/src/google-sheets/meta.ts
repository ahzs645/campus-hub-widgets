import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'google-sheets',
    name: 'Google Sheets',
    description: 'Display data, updates, and charts from Google Sheets on your screens',
    icon: 'brandGoogleSheets',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{ propName: 'url', types: ['embed'] }],
    defaultProps: {
      url: '',
      sheetName: '',
      cellRange: '',
      showTitle: false,
      title: '',
      zoom: 100,
      refreshInterval: 300,
    },
  },
  load: () => import('./GoogleSheets'),
  loadOptions: () => import('./GoogleSheetsOptions'),
});
