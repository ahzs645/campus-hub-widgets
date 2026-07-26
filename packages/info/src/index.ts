import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import cryptoTracker from './crypto-tracker/meta';
import exchangeRate from './exchange-rate/meta';
import homeAssistant from './home-assistant/meta';
import horoscope from './horoscope/meta';
import issTracker from './iss-tracker/meta';
import newsTicker from './news-ticker/meta';
import rssReader from './rss-reader/meta';
import stockQuotes from './stock-quotes/meta';
import teamSchedule from './team-schedule/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(cryptoTracker);
registerWidgetModule(exchangeRate);
registerWidgetModule(homeAssistant);
registerWidgetModule(horoscope);
registerWidgetModule(issTracker);
registerWidgetModule(newsTicker);
registerWidgetModule(rssReader);
registerWidgetModule(stockQuotes);
registerWidgetModule(teamSchedule);

export { cryptoTracker, exchangeRate, homeAssistant, horoscope, issTracker, newsTicker, rssReader, stockQuotes, teamSchedule };
