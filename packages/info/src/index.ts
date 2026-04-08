import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './news-ticker/NewsTicker';
import './exchange-rate/ExchangeRate';
import './crypto-tracker/CryptoTracker';
import './iss-tracker/ISSTracker';
import './rss-reader/RSSReader';
import './home-assistant/HomeAssistant';
import './horoscope/Horoscope';

// Register lazy loaders for display mode
registerWidgetLoader('news-ticker', () => import('./news-ticker/NewsTicker'));
registerWidgetLoader('exchange-rate', () => import('./exchange-rate/ExchangeRate'));
registerWidgetLoader('crypto-tracker', () => import('./crypto-tracker/CryptoTracker'));
registerWidgetLoader('iss-tracker', () => import('./iss-tracker/ISSTracker'));
registerWidgetLoader('rss-reader', () => import('./rss-reader/RSSReader'));
registerWidgetLoader('home-assistant', () => import('./home-assistant/HomeAssistant'));
registerWidgetLoader('horoscope', () => import('./horoscope/Horoscope'));
