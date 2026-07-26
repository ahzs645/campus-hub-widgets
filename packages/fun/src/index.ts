import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import bottleSpin from './bottle-spin/meta';
import coinDice from './coin-dice/meta';
import flashcard from './flashcard/meta';
import fortuneCookie from './fortune-cookie/meta';
import kaomoji from './kaomoji/meta';
import nothingGlyph from './nothing-glyph/meta';
import rockPaperScissors from './rock-paper-scissors/meta';
import trivia from './trivia/meta';
import wordOfTheDay from './word-of-the-day/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(bottleSpin);
registerWidgetModule(coinDice);
registerWidgetModule(flashcard);
registerWidgetModule(fortuneCookie);
registerWidgetModule(kaomoji);
registerWidgetModule(nothingGlyph);
registerWidgetModule(rockPaperScissors);
registerWidgetModule(trivia);
registerWidgetModule(wordOfTheDay);

export { bottleSpin, coinDice, flashcard, fortuneCookie, kaomoji, nothingGlyph, rockPaperScissors, trivia, wordOfTheDay };

// Public re-export used by the engine; sourced from the standalone modes
// module so it does not pull the widget component into the entry bundle.
export { MODES as NOTHING_GLYPH_MODES } from './nothing-glyph/modes';
