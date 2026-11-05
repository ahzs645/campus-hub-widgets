import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'groundwater-level',
    name: 'Groundwater Level',
    description: 'BC observation well groundwater levels',
    icon: 'droplets',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    acceptsSources: [{
      propName: 'apiUrl', types: ['api'], requires: { format: ['json'] },
      capabilityHint: 'AQUARIUS DatasetGrid URL with a dataset query parameter.',
      applySource: (source) => {
        let datasetId = '';
        try { datasetId = new URL(source.url).searchParams.get('dataset') ?? ''; } catch { /* validated when fetched */ }
        return { apiUrl: source.url, datasetId };
      },
      removeSource: () => ({ apiUrl: '', datasetId: '', dataSet: '', locationId: '' }),
    }],
    defaultProps: {
      apiUrl: '',
      locationId: '',
      datasetId: '',
      displayMode: 'current',
      refreshInterval: 30,
      useCorsProxy: true,
    },
  },
  load: () => import('./GroundwaterLevel'),
  loadOptions: () => import('./GroundwaterLevelOptions'),
});

