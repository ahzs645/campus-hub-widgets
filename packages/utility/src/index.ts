import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import qrcode from './qrcode/meta';
import simpleTable from './simple-table/meta';
import widgetStack from './widget-stack/meta';
import wifiShare from './wifi-share/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(qrcode);
registerWidgetModule(simpleTable);
registerWidgetModule(widgetStack);
registerWidgetModule(wifiShare);

export { qrcode, simpleTable, widgetStack, wifiShare };
