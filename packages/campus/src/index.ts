import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './cafeteria-menu/CafeteriaMenu';
import './club-spotlight/ClubSpotlight';
import './confessions/Confessions';
import './group-fitness/GroupFitness';
import './library-availability/LibraryAvailability';
import './job-board/JobBoard';
import './events-list/EventsList';
import './climbing-gym/ClimbingGym';
import './google-calendar/GoogleCalendar';
import './calendar/Calendar';

// Register lazy loaders for display mode
registerWidgetLoader('cafeteria-menu', () => import('./cafeteria-menu/CafeteriaMenu'));
registerWidgetLoader('club-spotlight', () => import('./club-spotlight/ClubSpotlight'));
registerWidgetLoader('confessions', () => import('./confessions/Confessions'));
registerWidgetLoader('group-fitness', () => import('./group-fitness/GroupFitness'));
registerWidgetLoader('library-availability', () => import('./library-availability/LibraryAvailability'));
registerWidgetLoader('job-board', () => import('./job-board/JobBoard'));
registerWidgetLoader('events-list', () => import('./events-list/EventsList'));
registerWidgetLoader('climbing-gym', () => import('./climbing-gym/ClimbingGym'));
registerWidgetLoader('google-calendar', () => import('./google-calendar/GoogleCalendar'));
registerWidgetLoader('calendar', () => import('./calendar/Calendar'));
