import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    description: 'Auto-playing RPS game',
    icon: 'hand',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: { playInterval: 15 },
  },
  load: () => import('./RockPaperScissors'),
  loadOptions: () => import('./RockPaperScissorsOptions'),
});
