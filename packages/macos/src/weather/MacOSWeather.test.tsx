import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MacOSWeather from './MacOSWeather';

const theme = {
  name: 'Test',
  primary: '#123456',
  secondary: '#456789',
  accent: '#abcdef',
  background: '#111111',
  text: '#ffffff',
};

const forecast = {
  current: {
    temperature_2m: 64,
    weather_code: 1,
    wind_speed_10m: 5,
    relative_humidity_2m: 50,
    is_day: 1,
  },
  daily: {
    time: ['2026-11-06'],
    temperature_2m_max: [68],
    temperature_2m_min: [50],
    weather_code: [1],
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Dashboard Weather bound-source units', () => {
  it('requests the selected units and keeps them in the request cache identity', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify(forecast)));
    vi.stubGlobal('fetch', fetchMock);
    const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=53.9&longitude=-122.7';

    const { rerender } = render(
      <MacOSWeather config={{ apiUrl, units: 'imperial' }} theme={theme} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('temperature_unit=fahrenheit');
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('wind_speed_unit=mph');

    rerender(<MacOSWeather config={{ apiUrl, units: 'metric' }} theme={theme} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(decodeURIComponent(String(fetchMock.mock.calls[1][0]))).toContain('temperature_unit=celsius');
    expect(decodeURIComponent(String(fetchMock.mock.calls[1][0]))).toContain('wind_speed_unit=kmh');
  });
});
