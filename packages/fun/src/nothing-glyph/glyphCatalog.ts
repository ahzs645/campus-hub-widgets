/** Provider animation catalogs belong in the host Source Store. */
export interface GlyphToy { id: string; name: string; creator: string; description: string; jsonUrl: string; isImageOnly?: boolean; }
const GLYPH_CATALOG: GlyphToy[] = [];
export default GLYPH_CATALOG;
