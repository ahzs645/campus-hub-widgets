import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'team-schedule',
    name: 'Team Schedule',
    description: 'Show upcoming games for a team with Phoenix Suns defaults.',
    icon: 'calendarRange',
    minW: 3,
    minH: 2,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api', 'feed'],
      capabilityHint: 'Works best with sources returning JSON schedule data: an array of games with date and opponent.',
      applySource: (source) => ({
        apiUrl: source.url,
        source: 'url',
      }),
    }],
    defaultProps: {
      title: 'Team Schedule',
      teamName: 'Phoenix Suns',
      league: 'NBA',
      source: 'demo',
      apiUrl: '',
      manualData: '',
      maxGames: 5,
      showVenue: true,
      showStatus: true,
      refreshInterval: 30,
      useCorsProxy: true,
    },
  },
  load: () => import('./TeamSchedule'),
  loadOptions: () => import('./TeamScheduleOptions'),
});
