import GLYPH_CATALOG from './glyphCatalog';

/**
 * Mode catalogue for the Nothing Glyph widget.
 *
 * Split out of the component so the package index can re-export it — and the
 * options UI and host can read it — without pulling the widget's rendering
 * engines (and lottie-web) into whoever imports it.
 */
export interface ModeEntry {
  id: string;
  name: string;
  description: string;
  type: 'native' | 'lottie';
  jsonUrl?: string;
}

// Native engines
export const NATIVE_MODES: ModeEntry[] = [
  { id: 'pendulum', name: 'Pendulum', description: 'Physics pendulum with trail', type: 'native' },
  { id: 'stack', name: 'Stack', description: 'Auto-playing stacker arcade', type: 'native' },
  { id: 'screenie', name: 'Screenie', description: 'Mood face with border fill', type: 'native' },
];

// Lottie preview modes from Nothing Playground catalog
export const LOTTIE_MODES: ModeEntry[] = GLYPH_CATALOG.map((g) => ({
  id: `lottie-${g.id}`,
  name: g.name,
  description: `${g.description} — ${g.creator}`,
  type: 'lottie' as const,
  jsonUrl: g.jsonUrl,
}));

export const MODES: ModeEntry[] = [...NATIVE_MODES, ...LOTTIE_MODES];
