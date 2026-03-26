import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './nothing-glyph/NothingGlyph';
import './bottle-spin/BottleSpin';
import './rock-paper-scissors/RockPaperScissors';
import './kaomoji/Kaomoji';
import './coin-dice/CoinDice';
import './word-of-the-day/WordOfTheDay';
import './flashcard/Flashcard';
import './trivia/TriviaGame';

// Register lazy loaders for display mode
registerWidgetLoader('nothing-glyph', () => import('./nothing-glyph/NothingGlyph'));
registerWidgetLoader('bottle-spin', () => import('./bottle-spin/BottleSpin'));
registerWidgetLoader('rock-paper-scissors', () => import('./rock-paper-scissors/RockPaperScissors'));
registerWidgetLoader('kaomoji', () => import('./kaomoji/Kaomoji'));
registerWidgetLoader('coin-dice', () => import('./coin-dice/CoinDice'));
registerWidgetLoader('word-of-the-day', () => import('./word-of-the-day/WordOfTheDay'));
registerWidgetLoader('flashcard', () => import('./flashcard/Flashcard'));
registerWidgetLoader('trivia-game', () => import('./trivia/TriviaGame'));

// Re-export MODES from nothing-glyph for external consumers
export { MODES as NOTHING_GLYPH_MODES } from './nothing-glyph/NothingGlyph';
