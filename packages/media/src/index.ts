import { registerWidgetLoader } from '@firstform/campus-hub-widget-sdk';

// Side-effect imports — trigger registerWidget calls
import './poster-carousel/PosterCarousel';
import './poster-feed/PosterFeed';
import './slideshow/Slideshow';
import './image/Image';
import './media-player/MediaPlayer';
import './youtube/YouTube';
import './web/Web';
import './rich-text/RichText';

// Register lazy loaders for display mode
registerWidgetLoader('poster-carousel', () => import('./poster-carousel/PosterCarousel'));
registerWidgetLoader('poster-feed', () => import('./poster-feed/PosterFeed'));
registerWidgetLoader('slideshow', () => import('./slideshow/Slideshow'));
registerWidgetLoader('image', () => import('./image/Image'));
registerWidgetLoader('media-player', () => import('./media-player/MediaPlayer'));
registerWidgetLoader('youtube', () => import('./youtube/YouTube'));
registerWidgetLoader('web', () => import('./web/Web'));
registerWidgetLoader('rich-text', () => import('./rich-text/RichText'));
