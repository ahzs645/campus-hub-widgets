import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import airQuality from './air-quality/meta';
import auroraForecast from './aurora-forecast/meta';
import droughtLevel from './drought-level/meta';
import fireHazard from './fire-hazard/meta';
import gasPrices from './gas-prices/meta';
import groundwaterLevel from './groundwater-level/meta';
import satelliteView from './satellite-view/meta';
import sunsetSunrise from './sunset-sunrise/meta';
import uvIndex from './uv-index/meta';
import weather from './weather/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(airQuality);
registerWidgetModule(auroraForecast);
registerWidgetModule(droughtLevel);
registerWidgetModule(fireHazard);
registerWidgetModule(gasPrices);
registerWidgetModule(groundwaterLevel);
registerWidgetModule(satelliteView);
registerWidgetModule(sunsetSunrise);
registerWidgetModule(uvIndex);
registerWidgetModule(weather);

export { airQuality, auroraForecast, droughtLevel, fireHazard, gasPrices, groundwaterLevel, satelliteView, sunsetSunrise, uvIndex, weather };
