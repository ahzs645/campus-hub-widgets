import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import calendar from './calendar/meta';
import clock from './clock/meta';
import dictionary from './dictionary/meta';
import ipod from './ipod/meta';
import stickyNote from './sticky-note/meta';
import stocks from './stocks/meta';
import translation from './translation/meta';
import weather from './weather/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(calendar);
registerWidgetModule(clock);
registerWidgetModule(dictionary);
registerWidgetModule(ipod);
registerWidgetModule(stickyNote);
registerWidgetModule(stocks);
registerWidgetModule(translation);
registerWidgetModule(weather);

export { calendar, clock, dictionary, ipod, stickyNote, stocks, translation, weather };
