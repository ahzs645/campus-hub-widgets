import ClubSpotlightModule from '../../campus/src/club-spotlight/meta';
import CalendarModule from '../../campus/src/calendar/meta';
import GoogleCalendarModule from '../../campus/src/google-calendar/meta';
import ConfessionsModule from '../../campus/src/confessions/meta';
import GroupFitnessModule from '../../campus/src/group-fitness/meta';
import ClimbingGymModule from '../../campus/src/climbing-gym/meta';
import CafeteriaMenuModule from '../../campus/src/cafeteria-menu/meta';
import PosterCarouselModule from '../../media/src/poster-carousel/meta';
import PosterFeedModule from '../../media/src/poster-feed/meta';
import SlideshowModule from '../../media/src/slideshow/meta';
import ImageWidgetModule from '../../media/src/image/meta';
import MediaPlayerModule from '../../media/src/media-player/meta';
import YouTubeModule from '../../media/src/youtube/meta';
import RadioStationModule from '../../media/src/radio-station/meta';
import StreamPlayerModule from '../../media/src/stream-player/meta';
import WebModule from '../../media/src/web/meta';
import WebRegionModule from '../../media/src/web-region/meta';
import CanvaModule from '../../media/src/canva/meta';
import GoogleSheetsModule from '../../media/src/google-sheets/meta';
import PowerPointModule from '../../media/src/powerpoint/meta';
import F1CountdownModule from '../../time/src/f1-countdown/meta';
import MacOSWeatherModule from '../../macos/src/weather/meta';
import MacOSStocksModule from '../../macos/src/stocks/meta';
import MacOSDictionaryModule from '../../macos/src/dictionary/meta';
import MacOSTranslationModule from '../../macos/src/translation/meta';
import JobBoardModule from '../../campus/src/job-board/meta';
import LibraryAvailabilityModule from '../../campus/src/library-availability/meta';
import EventsListModule from '../../campus/src/events-list/meta';
import MacOSCalendarModule from '../../macos/src/calendar/meta';
import MacOSIPodModule from '../../macos/src/ipod/meta';
import SimpleTableModule from '../../utility/src/simple-table/meta';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { WidgetPreviewProvider, applySourceBinding, buildWidgetInitialProps, removeSourceBinding, type LinkedSource, type WidgetComponentProps, type WidgetModule } from '@firstform/campus-hub-widget-sdk';
import ClubSpotlight from '../../campus/src/club-spotlight/ClubSpotlight';
import Calendar from '../../campus/src/calendar/Calendar';
import GoogleCalendar from '../../campus/src/google-calendar/GoogleCalendar';
import Confessions from '../../campus/src/confessions/Confessions';
import GroupFitness from '../../campus/src/group-fitness/GroupFitness';
import ClimbingGym from '../../campus/src/climbing-gym/ClimbingGym';
import CafeteriaMenu from '../../campus/src/cafeteria-menu/CafeteriaMenu';
import PosterCarousel from '../../media/src/poster-carousel/PosterCarousel';
import PosterFeed from '../../media/src/poster-feed/PosterFeed';
import Slideshow from '../../media/src/slideshow/Slideshow';
import ImageWidget from '../../media/src/image/Image';
import MediaPlayer from '../../media/src/media-player/MediaPlayer';
import YouTube from '../../media/src/youtube/YouTube';
import RadioStation from '../../media/src/radio-station/RadioStation';
import StreamPlayer from '../../media/src/stream-player/StreamPlayer';
import Web from '../../media/src/web/Web';
import WebRegion from '../../media/src/web-region/WebRegion';
import Canva from '../../media/src/canva/Canva';
import GoogleSheets from '../../media/src/google-sheets/GoogleSheets';
import PowerPoint from '../../media/src/powerpoint/PowerPoint';
import F1Countdown from '../../time/src/f1-countdown/F1Countdown';
import MacOSWeather from '../../macos/src/weather/MacOSWeather';
import MacOSStocks from '../../macos/src/stocks/MacOSStocks';
import MacOSDictionary from '../../macos/src/dictionary/MacOSDictionary';
import MacOSTranslation from '../../macos/src/translation/MacOSTranslation';
import JobBoard from '../../campus/src/job-board/JobBoard';
import LibraryAvailability from '../../campus/src/library-availability/LibraryAvailability';
import EventsList from '../../campus/src/events-list/EventsList';
import MacOSCalendar from '../../macos/src/calendar/MacOSCalendar';
import MacOSIPod from '../../macos/src/ipod/MacOSIPod';
import EventsListOptions from '../../campus/src/events-list/EventsListOptions';
import GroupFitnessOptions from '../../campus/src/group-fitness/GroupFitnessOptions';
import LibraryAvailabilityOptions from '../../campus/src/library-availability/LibraryAvailabilityOptions';
import SimpleTable from '../../utility/src/simple-table/SimpleTable';
import slideshowModule from '../../media/src/slideshow/meta';
import carouselModule from '../../media/src/poster-carousel/meta';
import radioModule from '../../media/src/radio-station/meta';
import googleCalendarModule from '../../campus/src/google-calendar/meta';
import { createDemoImage } from './demo';

const theme = { name: 'Test', primary: '#123456', secondary: '#456789', accent: '#abcdef', background: '#111111', text: '#ffffff' } as WidgetComponentProps['theme'];
const remote = 'https://configured.example/source';
const cases: Array<[string, ComponentType<WidgetComponentProps>, Record<string, unknown>]> = [
  ['Clubs', ClubSpotlight, { apiUrl: remote }],
  ['Calendar', Calendar, { calendarUrl: remote }],
  ['Google Calendar', GoogleCalendar, { calendarId: 'configured-id', apiKey: 'configured-key' }],
  ['Confessions', Confessions, { apiUrl: remote }],
  ['Group Fitness', GroupFitness, { scheduleUrl: remote }],
  ['Climbing Gym', ClimbingGym, { portalUrl: remote }],
  ['Cafeteria', CafeteriaMenu, { menuUrl: remote }],
  ['Poster Carousel', PosterCarousel, { apiUrl: remote, dataSource: 'api' }],
  ['Poster Feed', PosterFeed, { feedUrl: remote }],
  ['Slideshow', Slideshow, { slides: [{ id: 'saved', url: remote, caption: 'Live image' }] }],
  ['Image', ImageWidget, { url: remote }],
  ['Media Player', MediaPlayer, { url: remote }],
  ['YouTube', YouTube, { videoId: 'jfKfPfyJRdk' }],
  ['Radio', RadioStation, { metadataUrl: remote, audioUrl: remote, artworkUrl: remote }],
  ['Stream Player', StreamPlayer, { url: remote, format: 'embed' }],
  ['Web', Web, { url: remote }],
  ['Web Region', WebRegion, { url: remote }],
  ['Canva', Canva, { url: 'https://www.canva.com/design/saved/view' }],
  ['Google Sheets', GoogleSheets, { url: 'https://docs.google.com/spreadsheets/d/saved/edit' }],
  ['PowerPoint', PowerPoint, { url: `${remote}.pptx` }],
  ['F1', F1Countdown, { apiUrl: remote }],
  ['Dashboard Weather', MacOSWeather, { location: 'Vancouver', apiUrl: remote }],
  ['Stocks', MacOSStocks, { apiUrl: remote }],
  ['Dictionary', MacOSDictionary, { apiUrl: remote }],
  ['Translation', MacOSTranslation, { apiUrl: remote }],
  ['Job Board', JobBoard, { apiUrl: remote }],
  ['Library', LibraryAvailability, { endpoint: remote }],
  ['Events', EventsList, { apiUrl: remote }],
  ['macOS Calendar', MacOSCalendar, { apiUrl: remote }],
  ['iPod', MacOSIPod, { audioUrl: remote, coverUrl: remote }],
  ['Table', SimpleTable, { source: 'url', csvUrl: remote }],
];

const modules = new Map<ComponentType<WidgetComponentProps>, WidgetModule>([
  [ClubSpotlight, ClubSpotlightModule],
  [Calendar, CalendarModule],
  [GoogleCalendar, GoogleCalendarModule],
  [Confessions, ConfessionsModule],
  [GroupFitness, GroupFitnessModule],
  [ClimbingGym, ClimbingGymModule],
  [CafeteriaMenu, CafeteriaMenuModule],
  [PosterCarousel, PosterCarouselModule],
  [PosterFeed, PosterFeedModule],
  [Slideshow, SlideshowModule],
  [ImageWidget, ImageWidgetModule],
  [MediaPlayer, MediaPlayerModule],
  [YouTube, YouTubeModule],
  [RadioStation, RadioStationModule],
  [StreamPlayer, StreamPlayerModule],
  [Web, WebModule],
  [WebRegion, WebRegionModule],
  [Canva, CanvaModule],
  [GoogleSheets, GoogleSheetsModule],
  [PowerPoint, PowerPointModule],
  [F1Countdown, F1CountdownModule],
  [MacOSWeather, MacOSWeatherModule],
  [MacOSStocks, MacOSStocksModule],
  [MacOSDictionary, MacOSDictionaryModule],
  [MacOSTranslation, MacOSTranslationModule],
  [JobBoard, JobBoardModule],
  [LibraryAvailability, LibraryAvailabilityModule],
  [EventsList, EventsListModule],
  [MacOSCalendar, MacOSCalendarModule],
  [MacOSIPod, MacOSIPodModule],
  [SimpleTable, SimpleTableModule],
]);

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('Source unavailable', { status: 503 })));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function expectOfflineMedia(container: HTMLElement) {
  for (const element of container.querySelectorAll('img,iframe,video,audio,source')) {
    expect(element.getAttribute('src') ?? '').not.toMatch(/^(?:https?:)?\/\//);
  }
}

describe('local samples and forced previews', () => {
  it.each(cases)('%s has source-free empty and manifest defaults', (_name, Component) => {
    const { container, rerender } = render(<Component config={{}} theme={theme} />);
    expect(fetch).not.toHaveBeenCalled();
    expectOfflineMedia(container);
    expect(container.textContent).toMatch(/Demo|Sample/i);
    rerender(<Component config={buildWidgetInitialProps(modules.get(Component)!.manifest)} theme={theme} />);
    expect(fetch).not.toHaveBeenCalled();
    expectOfflineMedia(container);
    expect(container.textContent).toMatch(/Demo|Sample/i);
  });
  it.each(cases)('%s ignores saved sources in preview context', (_name, Component, config) => {
    const { container } = render(<WidgetPreviewProvider><Component config={config} theme={theme} /></WidgetPreviewProvider>);
    expect(fetch).not.toHaveBeenCalled();
    expectOfflineMedia(container);
    expect(container.textContent).toMatch(/Demo|Sample/i);
  });
  it('generates self-contained escaped artwork', () => {
    const uri = createDemoImage('<script>& "example"');
    const svg = decodeURIComponent(uri.split(',')[1]);
    expect(uri).toMatch(/^data:image\/svg\+xml/);
    expect(svg).toContain('&lt;script&gt;&amp; &quot;example&quot;');
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('href=');
  });
});

describe('configured failures remain failures', () => {
  it.each([
    ['Clubs', ClubSpotlight, { apiUrl: `${remote}/clubs` }, 'Outdoors Club'],
    ['Posters', PosterCarousel, { apiUrl: `${remote}/posters`, dataSource: 'api', useCorsProxy: false }, 'Spring Festival'],
    ['Poster feed', PosterFeed, { feedUrl: `${remote}/feed` }, 'Career Fair'],
  ['Table', SimpleTable, { source: 'url', csvUrl: `${remote}/table`, useCorsProxy: false }, 'Library 3A'],
    ['F1', F1Countdown, { apiUrl: `${remote}/f1` }, 'Sample Grand Prix'],
    ['Radio', RadioStation, { metadataUrl: `${remote}/radio` }, 'Morning Tide'],
  ] as Array<[string, ComponentType<WidgetComponentProps>, Record<string, unknown>, string]>)('%s never substitutes sample records after a request fails', async (_name, Component, config, sample) => {
    const { container } = render(<Component config={config} theme={theme} />);
    expect(container.textContent).not.toContain(sample);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() => expect(container.textContent).toMatch(/unavailable|failed|Offline/i));
    expect(container.textContent).not.toContain(sample);
    expect(container.textContent).not.toContain('Demo');
  });

  it('keeps an explicit image URL usable outside preview', () => {
    const { container } = render(<ImageWidget config={{ url: `${remote}/image.png` }} theme={theme} />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(`${remote}/image.png`);
    expect(container.textContent).not.toContain('Demo');
  });

  it('does not call the Google API or show pretend events for incomplete credentials', async () => {
    const { container } = render(<GoogleCalendar config={{ calendarId: 'saved-id' }} theme={theme} />);
    await waitFor(() => expect(container.textContent).toContain('Calendar unavailable'));
    expect(fetch).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('Demo');
  });
});

const source = (id: string, url = `${remote}/${id}`): LinkedSource => ({ _id: id, name: id, sourceType: 'image', url });
describe('shared source bindings', () => {
  it('upserts slideshow sources without replacing manual or other managed slides', () => {
    const binding = slideshowModule.manifest.acceptsSources![0];
    let props = applySourceBinding(source('first'), binding, { slides: [{ id: 'manual', url: 'data:image/png;base64,AA' }] });
    props = applySourceBinding(source('second'), binding, props);
    props = applySourceBinding(source('first', `${remote}/updated`), binding, props);
    expect(props.slides).toEqual([
      { id: 'manual', url: 'data:image/png;base64,AA' },
      { id: 'second', url: `${remote}/second`, caption: 'second' },
      { id: 'first', url: `${remote}/updated`, caption: 'first' },
    ]);
    expect(props.__sourceRefs).toHaveLength(2);
  });
  it('tracks the poster image property and deduplicates managed items', () => {
    const binding = carouselModule.manifest.acceptsSources![1];
    let props = applySourceBinding(source('poster'), binding, {});
    props = applySourceBinding(source('poster', `${remote}/new`), binding, props);
    expect(props.posters).toHaveLength(1);
    expect(props.__sourceRefs).toEqual([expect.objectContaining({ itemId: 'poster', urlProp: 'image', sourceId: 'poster' })]);
  });
  it('uses public source metadata for radio companion URLs', () => {
    const binding = radioModule.manifest.acceptsSources!.find((entry) => entry.propName === 'metadataUrl')!;
    const linked: LinkedSource = { ...source('station'), sourceType: 'api', metadata: { audioUrl: `${remote}/audio`, embedUrl: `${remote}/embed`, websiteUrl: `${remote}/site`, thumbnailUrl: `${remote}/art` } };
    const data = binding.applySource!(linked, {});
    expect(data).toMatchObject({ metadataUrl: linked.url, audioUrl: linked.metadata!.audioUrl, embedUrl: linked.metadata!.embedUrl, websiteUrl: linked.metadata!.websiteUrl });
  });
  it('clears radio companion playback when the metadata source is removed', () => {
    const binding = radioModule.manifest.acceptsSources!.find((entry) => entry.propName === 'metadataUrl')!;
    const unlinked = removeSourceBinding({ metadataUrl: remote, audioUrl: `${remote}/audio`, artworkUrl: `${remote}/art`, embedUrl: `${remote}/embed`, __sourceRef: { sourceId: 'station', propName: 'metadataUrl' } }, binding);
    const { container } = render(<RadioStation config={unlinked} theme={theme} />);
    expect(fetch).not.toHaveBeenCalled();
    expectOfflineMedia(container);
    expect(container.textContent).toContain('Demo');
  });
  it('connects a public calendar source as a URL rather than a calendar ID', () => {
    const binding = googleCalendarModule.manifest.acceptsSources![0];
    const data = applySourceBinding({ ...source('calendar'), sourceType: 'calendar' }, binding, {});
    expect(data.calendarUrl).toBe(`${remote}/calendar`);
    expect(data.calendarId).toBeUndefined();
  });
});


describe('source-free preview option panels', () => {
  it.each([
    ['Events', EventsListOptions, { apiUrl: remote, sourceType: 'json', useCorsProxy: false }],
    ['Fitness', GroupFitnessOptions, { scheduleUrl: remote, useCorsProxy: false }],
    ['Library', LibraryAvailabilityOptions, { endpoint: remote, useCorsProxy: false }],
  ] as const)('%s does not probe its configured source in preview context', async (_name, Options, data) => {
    vi.useFakeTimers();
    render(<WidgetPreviewProvider><Options data={data} onChange={vi.fn()} /></WidgetPreviewProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(fetch).not.toHaveBeenCalled();
  });
});
