import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'trivia-game',
    name: 'Trivia Game',
    description: 'Fun trivia questions with auto-rotation and answer reveals',
    icon: 'puzzle',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
    defaultProps: {
      category: 'all',
      rotationInterval: 15,
      revealDelay: 6,
      shuffle: true,
      customQuestions: '',
    },
  },
  load: () => import('./TriviaGame'),
  loadOptions: () => import('./TriviaOptions'),
});
