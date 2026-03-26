import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './weather/Weather';
import './air-quality/AirQuality';
import './uv-index/UvIndex';
import './fire-hazard/FireHazard';
import './aurora-forecast/AuroraForecast';
import './drought-level/DroughtLevel';
import './groundwater-level/GroundwaterLevel';
import './satellite-view/SatelliteView';
import './sunset-sunrise/SunsetSunrise';
import './gas-prices/GasPrices';

// Register lazy loaders for display mode
registerWidgetLoader('weather', () => import('./weather/Weather'));
registerWidgetLoader('air-quality', () => import('./air-quality/AirQuality'));
registerWidgetLoader('uv-index', () => import('./uv-index/UvIndex'));
registerWidgetLoader('fire-hazard', () => import('./fire-hazard/FireHazard'));
registerWidgetLoader('aurora-forecast', () => import('./aurora-forecast/AuroraForecast'));
registerWidgetLoader('drought-level', () => import('./drought-level/DroughtLevel'));
registerWidgetLoader('groundwater-level', () => import('./groundwater-level/GroundwaterLevel'));
registerWidgetLoader('satellite-view', () => import('./satellite-view/SatelliteView'));
registerWidgetLoader('sunset-sunrise', () => import('./sunset-sunrise/SunsetSunrise'));
registerWidgetLoader('gas-prices', () => import('./gas-prices/GasPrices'));
