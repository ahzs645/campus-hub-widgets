import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'coin-dice',
    name: 'Coin & Dice',
    description: 'Periodic coin flips and dice rolls with daily stats and distribution chart',
    icon: 'coins',
    minW: 2,
    minH: 2,
    maxW: 5,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      mode: 'both',
      interval: 60,
      diceType: 'd6',
    },
  },
  load: () => import('./CoinDice'),
  loadOptions: () => import('./CoinDiceOptions'),
});
