import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'flashcard',
    name: 'Flashcard',
    description: 'Auto-cycling vocabulary flashcards',
    icon: 'languages',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
    defaultProps: {
      language: 'spanish',
      mode: 'cycle',
      flipInterval: 5,
      cycleInterval: 12,
    },
  },
  load: () => import('./Flashcard'),
  loadOptions: () => import('./FlashcardOptions'),
});
