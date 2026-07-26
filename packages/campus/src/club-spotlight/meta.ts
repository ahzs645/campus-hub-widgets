import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'club-spotlight',
    name: 'Club Spotlight',
    description: 'Rotating spotlight of campus clubs from Over The Edge',
    icon: 'users',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 6,
    defaultW: 3,
    defaultH: 3,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-clubs',
      applySource: (source) => ({
        apiUrl: source.url,
        sourceAdapter: 'unbc-clubs',
      }),
    }],
    defaultProps: {
      apiUrl: '',
      pageUrl: '',
      rotationSeconds: 10,
      useCorsProxy: false,
      refreshMinutes: 30,
      showQrCode: false,
      qrLabel: 'Learn more',
    },
  },
  load: () => import('./ClubSpotlight'),
  loadOptions: () => import('./ClubSpotlightOptions'),
});
