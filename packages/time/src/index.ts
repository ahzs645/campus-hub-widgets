import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import clock from './clock/meta';
import countdown from './countdown/meta';
import f1Countdown from './f1-countdown/meta';
import holidayCalendar from './holiday-calendar/meta';
import timeProgress from './time-progress/meta';
import wordClock from './word-clock/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(clock);
registerWidgetModule(countdown);
registerWidgetModule(f1Countdown);
registerWidgetModule(holidayCalendar);
registerWidgetModule(timeProgress);
registerWidgetModule(wordClock);

export { clock, countdown, f1Countdown, holidayCalendar, timeProgress, wordClock };
