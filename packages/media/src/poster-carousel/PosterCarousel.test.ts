import { describe, expect, it } from 'vitest';
import { parseUNBCNewsPage } from './PosterCarousel';

const RELEASE_HTML = `
  <div class="article-item">
    <div class="article-item--col1">
      <a href="/our-stories/story/unbc-professor-receives-polar-medal-advancing-understanding-canadas-north-and-arctic">
        <img src="/sites/default/files/styles/featured/public/2026-06/polar-medal.jpg.webp" />
      </a>
    </div>
    <div class="article-item--col2">
      <h2 id="unbc-professor-receives-polar-medal-for-advancing-understanding">
        <a href="/our-stories/story/unbc-professor-receives-polar-medal-advancing-understanding-canadas-north-and-arctic" rel="bookmark">
          <span class="field field--name-title">UNBC Professor receives Polar Medal for advancing understanding of Canada&#039;s North and the Arctic</span>
        </a>
      </h2>
      <div class="field field--name-field-date"><time datetime="2026-06-30T12:00:00Z">Jun 30, 2026</time></div>
    </div>
  </div>
`;

describe('parseUNBCNewsPage', () => {
  it('parses the current h2 Drupal markup and decodes title entities', () => {
    const posters = parseUNBCNewsPage(RELEASE_HTML, 5, 'original');

    expect(posters).toHaveLength(1);
    expect(posters[0]).toMatchObject({
      title: "UNBC Professor receives Polar Medal for advancing understanding of Canada's North and the Arctic",
      subtitle: 'Jun 30, 2026',
      image: 'https://www.unbc.ca/sites/default/files/2026-06/polar-medal.jpg',
      fallbackImage: 'https://www.unbc.ca/sites/default/files/styles/featured/public/2026-06/polar-medal.jpg.webp',
    });
  });

  it('honours thumbnail image quality', () => {
    const [poster] = parseUNBCNewsPage(RELEASE_HTML, 1, 'thumbnail');

    expect(poster.image).toBe('https://www.unbc.ca/sites/default/files/styles/featured/public/2026-06/polar-medal.jpg.webp');
    expect(poster.fallbackImage).toBeUndefined();
  });
});
