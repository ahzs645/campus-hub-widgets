import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { WidgetPreviewProvider, applySourceBinding, buildWidgetInitialProps, removeSourceBinding, type WidgetComponentProps, type WidgetModule } from '@firstform/campus-hub-widget-sdk';
import AirQuality from './air-quality/AirQuality';
import airQuality from './air-quality/meta';
import AuroraForecast from './aurora-forecast/AuroraForecast';
import auroraForecast from './aurora-forecast/meta';
import DroughtLevel from './drought-level/DroughtLevel';
import droughtLevel from './drought-level/meta';
import FireHazard from './fire-hazard/FireHazard';
import fireHazard from './fire-hazard/meta';
import GasPrices from './gas-prices/GasPrices';
import gasPrices from './gas-prices/meta';
import GroundwaterLevel from './groundwater-level/GroundwaterLevel';
import groundwaterLevel from './groundwater-level/meta';
import SatelliteView from './satellite-view/SatelliteView';
import satelliteView from './satellite-view/meta';
import SunsetSunrise from './sunset-sunrise/SunsetSunrise';
import sunsetSunrise from './sunset-sunrise/meta';
import UvIndex from './uv-index/UvIndex';
import uvIndex from './uv-index/meta';
import Weather from './weather/Weather';
import weather from './weather/meta';
import CryptoTracker from '../../info/src/crypto-tracker/CryptoTracker';
import cryptoTracker from '../../info/src/crypto-tracker/meta';
import ExchangeRate from '../../info/src/exchange-rate/ExchangeRate';
import exchangeRate from '../../info/src/exchange-rate/meta';
import HomeAssistant from '../../info/src/home-assistant/HomeAssistant';
import homeAssistant from '../../info/src/home-assistant/meta';
import ISSTracker from '../../info/src/iss-tracker/ISSTracker';
import issTracker from '../../info/src/iss-tracker/meta';
import NewsTicker from '../../info/src/news-ticker/NewsTicker';
import newsTicker from '../../info/src/news-ticker/meta';
import RSSReader from '../../info/src/rss-reader/RSSReader';
import rssReader from '../../info/src/rss-reader/meta';
import StockQuotes from '../../info/src/stock-quotes/StockQuotes';
import stockQuotes from '../../info/src/stock-quotes/meta';
import TeamSchedule from '../../info/src/team-schedule/TeamSchedule';
import teamSchedule from '../../info/src/team-schedule/meta';
import BusConnection from '../../transit/src/bus-connection/BusConnection';
import busConnection from '../../transit/src/bus-connection/meta';
import { createLiveTripProvider } from '../../transit/src/bus-connection/transit/gtfsService';

// Rendering a canvas/font is unrelated to whether the transit widget selects
// and fetches its data source. Keep its actual data provider in these tests.
vi.mock('react-pixel-display', () => ({ usePixelDisplay: () => ({ containerRef: { current: null }, rendererRef: { current: null } }) }));
vi.mock('../../transit/src/bus-connection/transit/renderer', () => ({ loadPixollettaFont: async () => {}, renderTransitDisplay: () => [] }));

const theme = { name: 'Test', primary: '#123456', secondary: '#456789', accent: '#abcdef', background: '#111111', text: '#ffffff' } as WidgetComponentProps['theme'];
const remote = 'https://configured.example/source';
type WidgetCase = [string, ComponentType<WidgetComponentProps>, WidgetModule, Record<string, unknown>];
const cases: WidgetCase[] = [
  ['Air quality', AirQuality, airQuality, { apiUrl: `${remote}/aqhi`, dataSource: 'bc-aqhi' }],
  ['Aurora', AuroraForecast, auroraForecast, { apiUrl: `${remote}/aurora` }],
  ['Drought', DroughtLevel, droughtLevel, { apiUrl: `${remote}/drought` }],
  ['Fire hazard', FireHazard, fireHazard, { apiUrl: `${remote}/fire` }],
  ['Gas prices', GasPrices, gasPrices, { url: `${remote}/gas` }],
  ['Groundwater', GroundwaterLevel, groundwaterLevel, { apiUrl: `${remote}/water?dataset=123`, datasetId: '123', locationId: 'OW378' }],
  ['Satellite', SatelliteView, satelliteView, { tileUrl: `${remote}/{z}/{x}/{y}.jpg`, lat: 12, lon: 34 }],
  ['Sunrise', SunsetSunrise, sunsetSunrise, { apiUrl: `${remote}/sun`, latitude: 12, longitude: 34 }],
  ['UV index', UvIndex, uvIndex, { dataSource: 'openuv', openUvApiKey: 'configured-key', city: 'Toronto' }],
  ['Weather', Weather, weather, { dataSource: 'openweathermap', apiKey: 'configured-key', location: 'Toronto' }],
  ['Crypto', CryptoTracker, cryptoTracker, { apiUrl: `${remote}/crypto`, coins: ['bitcoin'] }],
  ['Exchange', ExchangeRate, exchangeRate, { apiUrl: `${remote}/rates`, baseCurrency: 'CAD' }],
  ['Home Assistant', HomeAssistant, homeAssistant, { mode: 'http', httpUrl: `${remote}/ha`, entityIds: ['sensor.temperature'] }],
  ['ISS', ISSTracker, issTracker, { apiUrl: `${remote}/iss` }],
  ['News', NewsTicker, newsTicker, { apiUrl: `${remote}/news`, dataSource: 'announcements' }],
  ['RSS', RSSReader, rssReader, { feedUrl: `${remote}/feed` }],
  ['Stocks', StockQuotes, stockQuotes, { apiUrl: `${remote}/stocks`, symbols: ['AAPL'] }],
  ['Team schedule', TeamSchedule, teamSchedule, { apiUrl: `${remote}/team`, source: 'url' }],
  ['Transit', BusConnection, busConnection, { gtfsUrl: `${remote}/gtfs.zip`, realtimeUrl: `${remote}/realtime.pb` }],
];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('fetch', vi.fn(async () => new Response('Source unavailable', { status: 503 })));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function expectLocalSample(container: HTMLElement) {
  expect(fetch).not.toHaveBeenCalled();
  expect(container.textContent).toContain('Demo');
  for (const element of container.querySelectorAll('img,iframe,video,audio,source')) {
    expect(element.getAttribute('src') ?? '').not.toMatch(/^(?:https?:)?\/\//);
  }
}

describe('environment, information and transit source defaults', () => {
  it.each(cases)('%s renders both empty and manifest defaults without a source request', async (_name, Component, module) => {
    const rendered = render(<Component config={{}} theme={theme} />);
    await act(async () => {});
    expectLocalSample(rendered.container);
    rendered.rerender(<Component config={buildWidgetInitialProps(module.manifest)} theme={theme} />);
    await act(async () => {});
    expectLocalSample(rendered.container);
  });

  it.each(cases)('%s ignores configured endpoints and provider credentials in sample previews', async (_name, Component, _module, config) => {
    const { container } = render(<WidgetPreviewProvider><Component config={config} theme={theme} /></WidgetPreviewProvider>);
    await act(async () => {});
    expectLocalSample(container);
  });

  it.each(cases.filter(([name]) => !['Satellite', 'UV index', 'Weather'].includes(name)))('%s reports a failing configured source without replacing it with samples', async (_name, Component, _module, config) => {
    const { container } = render(<Component config={{ ...config, useCorsProxy: false }} theme={theme} />);
    expect(container.textContent).not.toContain('Demo');
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() => expect(container.textContent).toMatch(/unavailable|unable|HTTP 503/i));
    expect(container.textContent).not.toContain('Demo');
  });
});

describe('removing a saved source', () => {
  it.each(cases.filter(([name]) => !['UV index', 'Weather'].includes(name)))('%s returns to local sample mode without reactivating legacy defaults', async (_name, Component, module, config) => {
    const binding = module.manifest.acceptsSources![0];
    const url = (config[binding.propName] as string | undefined) ?? remote;
    const linked = applySourceBinding({ _id: 'saved', name: 'Saved source', sourceType: binding.types[0], url }, binding, { ...buildWidgetInitialProps(module.manifest), ...config });
    const unlinked = removeSourceBinding(linked, binding);
    const { container } = render(<Component config={unlinked} theme={theme} />);
    await act(async () => {});
    expectLocalSample(container);
    expect(unlinked.__sourceRef).toBeUndefined();
  });
});

describe('selected endpoints remain authoritative', () => {
  it('keeps a drought source query filter while adding the parser fields', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ features: [{ attributes: { BasinName: 'Selected Basin', DroughtLevel: 2, Date_Modified: null, Comments: null } }] })));
    const { container } = render(<DroughtLevel config={{ apiUrl: `${remote}/chosen-drought?where=BasinName%3D%27Selected%27`, useCorsProxy: false }} theme={theme} />);
    await waitFor(() => expect(container.textContent).toContain('Selected Basin'));
    const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(url.pathname).toBe('/source/chosen-drought');
    expect(url.searchParams.get('where')).toBe("BasinName='Selected'");
    expect(url.searchParams.get('outFields')).toContain('DroughtLevel');
    expect(container.textContent).not.toContain('Demo');
  });

  it('does not call a second timezone provider for a saved sunrise source', async () => {
    const iso = (hour: number) => new Date(2026, 4, 1, hour).toISOString();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ status: 'OK', results: { sunrise: iso(6), sunset: iso(19), solar_noon: iso(12), day_length: 46800, civil_twilight_begin: iso(5), civil_twilight_end: iso(20) } })));
    const { container } = render(<SunsetSunrise config={{ apiUrl: `${remote}/selected-sun?tenant=campus`, latitude: 53, longitude: -122 }} theme={theme} />);
    await waitFor(() => expect(container.textContent).not.toContain('Loading sun'));
    expect(fetch).toHaveBeenCalledTimes(1);
    const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(url.pathname).toBe('/source/selected-sun');
    expect(url.searchParams.get('tenant')).toBe('campus');
    expect(url.searchParams.get('lat')).toBe('53');
    expect(container.textContent).not.toContain('Demo');
  });

  it('surfaces a transit feed failure without falling back to the packaged timetable', async () => {
    const updated = vi.fn();
    const onError = vi.fn();
    const provider = createLiveTripProvider(updated, { gtfsUrl: `${remote}/failed-transit.zip`, useCorsProxy: false, onError });
    await provider.refresh();
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/503/));
    expect(updated).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    provider.stop();
  });
});
