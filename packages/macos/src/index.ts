import './styles.css';

import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

import './clock/MacOSClock';
import './weather/MacOSWeather';
import './stocks/MacOSStocks';
import './calendar/MacOSCalendar';
import './dictionary/MacOSDictionary';
import './translation/MacOSTranslation';
import './sticky-note/MacOSStickyNote';
import './ipod/MacOSIPod';

registerWidgetLoader('macos-clock', () => import('./clock/MacOSClock'));
registerWidgetLoader('macos-weather', () => import('./weather/MacOSWeather'));
registerWidgetLoader('macos-stocks', () => import('./stocks/MacOSStocks'));
registerWidgetLoader('macos-calendar', () => import('./calendar/MacOSCalendar'));
registerWidgetLoader('macos-dictionary', () => import('./dictionary/MacOSDictionary'));
registerWidgetLoader('macos-translation', () => import('./translation/MacOSTranslation'));
registerWidgetLoader('macos-sticky-note', () => import('./sticky-note/MacOSStickyNote'));
registerWidgetLoader('macos-ipod', () => import('./ipod/MacOSIPod'));
