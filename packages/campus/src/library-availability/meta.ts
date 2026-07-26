import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'library-availability',
    name: 'Library Availability',
    description: 'Live UNBC LibCal study-room openings',
    icon: 'calendar',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{
      propName: 'endpoint',
      types: ['api'],
      matchSource: (source) =>
        resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'libcal-room-availability',
      applySource: (source) => ({
        endpoint: source.url,
        sourceAdapter: 'libcal-room-availability',
      }),
    }],
    defaultProps: {
      title: 'Library Study Room Availability',
      mode: 'grid',
      roomScope: 'all',
      selectedRoomId: '',
      endpoint: '',
      lid: 1637,
      gid: 2928,
      pageSize: 99,
      daysToShow: 3,
      rotationSeconds: 8,
      refreshSeconds: 120,
      openHour: 8,
      closeHour: 23,
      useCorsProxy: true,
    },
  },
  load: () => import('./LibraryAvailability'),
  loadOptions: () => import('./LibraryAvailabilityOptions'),
});
