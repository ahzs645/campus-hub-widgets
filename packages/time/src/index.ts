import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './clock/Clock';
import './countdown/Countdown';
import './time-progress/TimeProgress';
import './holiday-calendar/HolidayCalendar';
import './f1-countdown/F1Countdown';
import './word-clock/WordClock';

// Register lazy loaders for display mode
registerWidgetLoader('clock', () => import('./clock/Clock'));
registerWidgetLoader('countdown', () => import('./countdown/Countdown'));
registerWidgetLoader('time-progress', () => import('./time-progress/TimeProgress'));
registerWidgetLoader('holiday-calendar', () => import('./holiday-calendar/HolidayCalendar'));
registerWidgetLoader('f1-countdown', () => import('./f1-countdown/F1Countdown'));
registerWidgetLoader('word-clock', () => import('./word-clock/WordClock'));
