import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './qrcode/QRCode';
import './widget-stack/WidgetStack';
import './simple-table/SimpleTable';

// Register lazy loaders for display mode
registerWidgetLoader('qrcode', () => import('./qrcode/QRCode'));
registerWidgetLoader('widget-stack', () => import('./widget-stack/WidgetStack'));
registerWidgetLoader('simple-table', () => import('./simple-table/SimpleTable'));
