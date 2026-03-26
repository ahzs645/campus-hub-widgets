'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchTextWithCache } from '@firstform/campus-hub-widget-sdk';
import { ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import GasPricesOptions from './GasPricesOptions';

interface StationPrice {
  name: string;
  price: number; // cents
  address: string;
}

const DEFAULT_URL =
  'https://www.gasbuddy.com/gasprices/british-columbia/prince-george';

function parseGasPrices(html: string): StationPrice[] {
  const stations: StationPrice[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const stationEls = doc.querySelectorAll(
    '[class*="GenericStationListItem-module__station"]'
  );

  stationEls.forEach((el) => {
    const nameEl = el.querySelector(
      '[class*="StationDisplay-module__stationNameHeader"] a'
    );
    const priceEl = el.querySelector(
      '[class*="StationDisplayPrice-module__price"]'
    );
    const addressEl = el.querySelector(
      '[class*="StationDisplay-module__address"]'
    );

    if (nameEl && priceEl) {
      const priceText = (priceEl.textContent ?? '').replace(/[^0-9.]/g, '');
      const price = parseFloat(priceText);
      if (!isNaN(price)) {
        stations.push({
          name: (nameEl.textContent ?? '').trim(),
          price,
          address: (addressEl?.textContent ?? '').replace(/\n/g, ', ').trim(),
        });
      }
    }
  });

  return stations;
}

export default function GasPrices({ config: cfg, theme }: WidgetComponentProps) {
  const [stations, setStations] = useState<StationPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const url = (cfg?.url as string) || DEFAULT_URL;
  const refreshInterval = (cfg?.refreshInterval as number) ?? 30;
  const useCorsProxy = (cfg?.useCorsProxy as boolean) ?? true;
  const maxStations = (cfg?.maxStations as number) ?? 10;

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const fetchUrl = useCorsProxy ? buildProxyUrl(url) : url;
      const { text } = await fetchTextWithCache(fetchUrl, {
        cacheKey: buildCacheKey('gas-prices', url),
        ttlMs: refreshInterval * 60 * 1000,
      });
      const parsed = parseGasPrices(text);
      if (parsed.length === 0) {
        setError('No prices found');
      } else {
        setStations(parsed.slice(0, maxStations));
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [url, useCorsProxy, refreshInterval, maxStations]);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, refreshInterval * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchPrices, refreshInterval]);

  const avgPrice =
    stations.length > 0
      ? stations.reduce((s, st) => s + st.price, 0) / stations.length
      : 0;

  const lowestPrice = stations.length > 0
    ? Math.min(...stations.map((s) => s.price))
    : 0;

  const highestPrice = stations.length > 0
    ? Math.max(...stations.map((s) => s.price))
    : 0;

  return (
    <ThemedContainer theme={theme} className="flex flex-col h-full p-4 gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">⛽</span>
        <div>
          <h2 className="text-lg font-bold leading-tight text-white">Gas Prices</h2>
          <p className="text-xs text-white/50">Prince George, BC</p>
        </div>
      </div>

      {loading && !stations.length && (
        <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {stations.length > 0 && (
        <>
          {/* Average price banner */}
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <div className="text-xs text-white/50 uppercase tracking-wide">Average Price</div>
            <div className="text-3xl font-bold text-white">{avgPrice.toFixed(1)}<span className="text-lg">¢/L</span></div>
            <div className="flex justify-center gap-4 mt-1 text-xs text-white/60">
              <span>Low: {lowestPrice.toFixed(1)}¢</span>
              <span>High: {highestPrice.toFixed(1)}¢</span>
            </div>
          </div>

          {/* Station list */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
            {stations.map((st, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded px-2 py-1.5 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{st.name}</div>
                  <div className="text-xs text-white/40 truncate">{st.address}</div>
                </div>
                <div
                  className={`text-sm font-bold ml-2 whitespace-nowrap ${
                    st.price === lowestPrice
                      ? 'text-green-400'
                      : st.price === highestPrice
                        ? 'text-red-400'
                        : 'text-white'
                  }`}
                >
                  {st.price.toFixed(1)}¢
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lastUpdated && (
        <div className="text-xs text-white/40 text-right">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </ThemedContainer>
  );
}

registerWidget({
  type: 'gas-prices',
  name: 'Gas Prices',
  description: 'Display average gas prices from GasBuddy for Prince George, BC',
  icon: 'flame',
  minW: 2,
  minH: 3,
  defaultW: 3,
  defaultH: 4,
  component: GasPrices,
  OptionsComponent: GasPricesOptions,
  defaultProps: {
    url: DEFAULT_URL,
    refreshInterval: 30,
    useCorsProxy: true,
    maxStations: 10,
  },
});
