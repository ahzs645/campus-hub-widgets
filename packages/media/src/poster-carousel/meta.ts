import { defineWidget } from '@firstform/campus-hub-widget-sdk';
import { resolveSourceAdapter } from '@firstform/campus-hub-widget-sdk';
import type { Poster } from './PosterCarousel';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'poster-carousel',
    name: 'Poster Carousel',
    description: 'Rotating display of event posters and announcements',
    icon: 'carousel',
    minW: 4,
    minH: 3,
    defaultW: 8,
    defaultH: 5,
    acceptsSources: [{
      propName: 'apiUrl',
      types: ['api', 'feed'],
      requires: { hasImages: true },
      capabilityHint: 'Sources with images look best in the carousel; text-only feeds show over a fallback background.',
      unlinkLabel: 'Use manual posters',
      removeSource: () => ({ dataSource: 'default' }),
      applySource: (source) => {
        const adapter = resolveSourceAdapter({ url: source.url, presetId: source.presetId });
        if (adapter) {
          return {
            apiUrl: source.url,
            dataSource: 'source',
            sourceAdapter: adapter.id,
            sourceLabel: source.metadata?.provider || adapter.label,
          };
        }
        return {
          apiUrl: source.url,
          dataSource: 'api',
        };
      },
    }, {
      propName: 'posters',
      types: ['image', 'unsplash'],
      multiple: true,
      applySource: (source, currentData) => {
        const existingPosters = Array.isArray(currentData.posters)
          ? currentData.posters as Poster[]
          : [];
        return {
          dataSource: 'default',
          posters: [
            ...existingPosters,
            {
              id: source._id,
              title: source.name,
              subtitle: source.description,
              image: source.url,
            },
          ],
        };
      },
    }],
    defaultProps: {
      rotationSeconds: 10,
      useCorsProxy: true,
      showText: true,
      showProgressBar: true,
      showSequenceIndicator: true,
    },
  },
  load: () => import('./PosterCarousel'),
  loadOptions: () => import('./PosterCarouselOptions'),
});
