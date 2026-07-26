import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'poster-feed',
    name: 'Poster Feed',
    description: 'RSS feed posters with stack, carousel, or fade animations',
    icon: 'newspaper',
    minW: 3,
    minH: 2,
    defaultW: 6,
    defaultH: 4,
    acceptsSources: [{
      propName: 'feedUrl',
      types: ['feed'],
      requires: { hasImages: true },
      capabilityHint: 'Feeds whose entries carry images render as posters; text-only feeds have nothing to show.',
    }],
    defaultProps: {
      rotationSeconds: 8,
      animationMode: 'stack',
    },
  },
  load: () => import('./PosterFeed'),
  loadOptions: () => import('./PosterFeedOptions'),
});
