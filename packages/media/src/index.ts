import { registerWidgetModule } from '@firstform/campus-hub-widget-sdk';
import canva from './canva/meta';
import googleSheets from './google-sheets/meta';
import image from './image/meta';
import mediaPlayer from './media-player/meta';
import posterCarousel from './poster-carousel/meta';
import posterFeed from './poster-feed/meta';
import powerpoint from './powerpoint/meta';
import radioStation from './radio-station/meta';
import richText from './rich-text/meta';
import slideshow from './slideshow/meta';
import streamPlayer from './stream-player/meta';
import webRegion from './web-region/meta';
import web from './web/meta';
import youtube from './youtube/meta';

// Metadata only — every component stays behind its module's loaders until a
// board actually places the widget.
registerWidgetModule(canva);
registerWidgetModule(googleSheets);
registerWidgetModule(image);
registerWidgetModule(mediaPlayer);
registerWidgetModule(posterCarousel);
registerWidgetModule(posterFeed);
registerWidgetModule(powerpoint);
registerWidgetModule(radioStation);
registerWidgetModule(richText);
registerWidgetModule(slideshow);
registerWidgetModule(streamPlayer);
registerWidgetModule(webRegion);
registerWidgetModule(web);
registerWidgetModule(youtube);

export { canva, googleSheets, image, mediaPlayer, posterCarousel, posterFeed, powerpoint, radioStation, richText, slideshow, streamPlayer, webRegion, web, youtube };
