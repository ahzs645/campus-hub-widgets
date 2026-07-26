import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import busConnection from './bus-connection/meta';

// Metadata only. The components — and gtfs-realtime-bindings, fflate and
// react-pixel-display with them — stay behind the module's loaders until a
// board actually places the widget.
//
// Previously this file statically imported the component *and* registered a
// dynamic loader for it. A module that is both statically and dynamically
// imported stays in the static chunk, so the loader bought nothing.
registerWidgetModule(busConnection);

export { busConnection };
