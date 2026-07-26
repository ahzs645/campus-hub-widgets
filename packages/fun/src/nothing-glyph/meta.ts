import { defineWidget } from '@firstform/campus-hub-widget-sdk';

/**
 * Loaded by every host that reads the widget catalogue, so it must stay free
 * of component and library imports.
 */
export default defineWidget({
  manifest: {
    type: 'nothing-glyph',
    name: 'Nothing Glyph',
    description: 'Nothing Phone glyph matrix animations — Pendulum, Stack, Screenie & more',
    icon: 'sparkles',
    minW: 2,
    minH: 2,
    maxW: 5,
    maxH: 5,
    defaultW: 3,
    defaultH: 3,
    defaultProps: {
      mode: 'pendulum',
      glow: true,
      pixelSize: 12,
      brightness: 4095,
    },
  },
  load: () => import('./NothingGlyph'),
  loadOptions: () => import('./NothingGlyphOptions'),
});
