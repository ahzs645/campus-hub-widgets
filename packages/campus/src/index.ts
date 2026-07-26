import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import cafeteriaMenu from './cafeteria-menu/meta';
import calendar from './calendar/meta';
import climbingGym from './climbing-gym/meta';
import clubSpotlight from './club-spotlight/meta';
import confessions from './confessions/meta';
import eventsList from './events-list/meta';
import googleCalendar from './google-calendar/meta';
import groupFitness from './group-fitness/meta';
import jobBoard from './job-board/meta';
import libraryAvailability from './library-availability/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(cafeteriaMenu);
registerWidgetModule(calendar);
registerWidgetModule(climbingGym);
registerWidgetModule(clubSpotlight);
registerWidgetModule(confessions);
registerWidgetModule(eventsList);
registerWidgetModule(googleCalendar);
registerWidgetModule(groupFitness);
registerWidgetModule(jobBoard);
registerWidgetModule(libraryAvailability);

export { cafeteriaMenu, calendar, climbingGym, clubSpotlight, confessions, eventsList, googleCalendar, groupFitness, jobBoard, libraryAvailability };
