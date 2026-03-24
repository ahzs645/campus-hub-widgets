import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './bus-connection/BusConnection';

// Register lazy loaders for display mode
registerWidgetLoader('bus-connection', () => import('./bus-connection/BusConnection'));
