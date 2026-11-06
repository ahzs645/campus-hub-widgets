import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'slideshow',
    name: 'Slideshow',
    description: 'Rotating image slideshow with captions',
    icon: 'slideshow',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{
      propName: 'slides', types: ['image', 'unsplash'], multiple: true,
      applySource: (source, currentData) => ({
        slides: [
          ...(Array.isArray(currentData.slides) ? currentData.slides : []).filter((slide) => slide?.id !== source._id),
          { id: source._id, url: source.url, caption: source.name },
        ],
      }),
    }],
    defaultProps: {
      slides: [],
      duration: 5,
      transition: 'fade',
      showCaptions: true,
      showProgress: true,
    },
  },
  load: () => import('./Slideshow'),
  loadOptions: () => import('./SlideshowOptions'),
});

