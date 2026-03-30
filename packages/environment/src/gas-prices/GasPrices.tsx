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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColors(base: string, target: string, weight: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) return target;

  const clampedWeight = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clampedWeight);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

const DEFAULT_URL =
  'https://www.gasbuddy.com/gasprices/british-columbia/prince-george';

const DEMO_STATIONS: StationPrice[] = [
  { name: 'Costco', price: 164.9, address: '2555 Range Rd, Prince George' },
  { name: 'Esso', price: 171.9, address: '2100 Ferry Ave, Prince George' },
  { name: 'Shell', price: 172.9, address: '1500 Victoria St, Prince George' },
  { name: 'Petro-Canada', price: 174.9, address: '3800 15th Ave, Prince George' },
  { name: 'Chevron', price: 175.9, address: '1234 Central St W, Prince George' },
];

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
  const [stations, setStations] = useState<StationPrice[]>(DEMO_STATIONS);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

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

  const panelBg = theme.background;
  const headlineColor = mixColors(theme.background, '#ffffff', 0.96);
  const secondaryText = mixColors(theme.background, '#ffffff', 0.68);
  const tertiaryText = mixColors(theme.background, '#ffffff', 0.42);
  const bannerBg = mixColors(theme.background, theme.accent, 0.16);
  const bannerBorder = mixColors(theme.background, theme.accent, 0.28);
  const rowBg = mixColors(theme.background, '#ffffff', 0.05);
  const rowHoverBg = mixColors(theme.background, '#ffffff', 0.1);
  const lowPriceColor = theme.accent;
  const highPriceColor = mixColors(theme.accent, '#ffffff', 0.42);
  const neutralPriceColor = headlineColor;

  return (
    <ThemedContainer
      theme={theme}
      color="background"
      className="flex flex-col h-full p-4 gap-2 overflow-hidden"
      style={{
        backgroundColor: panelBg,
        backgroundImage: 'linear-gradient(var(--widget-theme-tint, transparent), var(--widget-theme-tint, transparent))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">⛽</span>
        <div>
          <h2 className="text-lg font-bold leading-tight" style={{ color: headlineColor }}>Gas Prices</h2>
          <p className="text-xs" style={{ color: tertiaryText }}>Prince George, BC</p>
        </div>
      </div>

      {loading && !stations.length && (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: tertiaryText }}>
          Loading...
        </div>
      )}

      {error && (
        <div className="text-sm" style={{ color: theme.accent }}>{error}</div>
      )}

      {stations.length > 0 && (
        <>
          {/* Average price banner */}
          <div
            className="rounded-lg p-3 text-center"
            style={{
              backgroundColor: bannerBg,
              border: `1px solid ${bannerBorder}`,
            }}
          >
            <div className="text-xs uppercase tracking-wide" style={{ color: secondaryText }}>Average Price</div>
            <div className="text-3xl font-bold" style={{ color: headlineColor }}>
              {avgPrice.toFixed(1)}<span className="text-lg">¢/L</span>
            </div>
            <div className="flex justify-center gap-4 mt-1 text-xs" style={{ color: secondaryText }}>
              <span>Low: {lowestPrice.toFixed(1)}¢</span>
              <span>High: {highestPrice.toFixed(1)}¢</span>
            </div>
          </div>

          {/* Station list */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
            {stations.map((st, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded px-2 py-1.5 transition-colors"
                style={{ backgroundColor: rowBg }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = rowHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBg;
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: headlineColor }}>{st.name}</div>
                  <div className="text-xs truncate" style={{ color: tertiaryText }}>{st.address}</div>
                </div>
                <div
                  className="text-sm font-bold ml-2 whitespace-nowrap"
                  style={{
                    color:
                      st.price === lowestPrice
                        ? lowPriceColor
                        : st.price === highestPrice
                          ? highPriceColor
                          : neutralPriceColor,
                  }}
                >
                  {st.price.toFixed(1)}¢
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lastUpdated && (
        <div className="text-xs text-right" style={{ color: tertiaryText }}>
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
