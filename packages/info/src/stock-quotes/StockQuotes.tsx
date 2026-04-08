'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DarkContainer,
  buildCacheKey,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
  useFitScale,
} from '@firstform/campus-hub-widget-sdk';
import StockQuotesOptions from './StockQuotesOptions';

interface StockQuotesConfig {
  title?: string;
  symbols?: string[];
  chartSymbol?: string;
  range?: '1mo' | '3mo' | '6mo' | '1y';
  refreshInterval?: number;
  showChart?: boolean;
  showChange?: boolean;
  showNames?: boolean;
}

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface ChartPoint {
  timestamp: number;
  close: number;
}

interface StocksResponse {
  quotes?: Quote[];
  chart?: ChartPoint[];
}

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'SPY'];

const DEMO_QUOTES: Quote[] = [
  { symbol: 'AAPL', name: 'Apple', price: 214.39, change: 2.11, changePercent: 0.99 },
  { symbol: 'MSFT', name: 'Microsoft', price: 428.62, change: -1.48, changePercent: -0.34 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 912.75, change: 12.81, changePercent: 1.42 },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 521.18, change: 3.44, changePercent: 0.66 },
];

const buildDemoChart = (): ChartPoint[] => {
  const now = Date.now();
  const closes = [856, 861, 867, 872, 878, 884, 890, 899, 907, 912];
  return closes.map((close, index) => ({
    timestamp: now - (closes.length - index) * 24 * 60 * 60 * 1000,
    close,
  }));
};

const DEMO_CHART = buildDemoChart();

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

  const clamp = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clamp);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (value >= 100) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

function formatSignedNumber(value: number): string {
  const abs = Math.abs(value);
  return `${value >= 0 ? '+' : '-'}${abs.toFixed(abs >= 10 ? 2 : 2)}`;
}

function formatSignedPercent(value: number): string {
  const abs = Math.abs(value);
  return `${value >= 0 ? '+' : '-'}${abs.toFixed(2)}%`;
}

function rangeLabel(range: StockQuotesConfig['range']): string {
  switch (range) {
    case '1mo':
      return '1M';
    case '3mo':
      return '3M';
    case '1y':
      return '1Y';
    case '6mo':
    default:
      return '6M';
  }
}

function Sparkline({
  points,
  stroke,
  fill,
}: {
  points: ChartPoint[];
  stroke: string;
  fill: string;
}) {
  if (points.length < 2) return null;

  const width = 220;
  const height = 96;
  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point.close - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="w-full h-full">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StockQuotes({ config, theme }: WidgetComponentProps) {
  const stockConfig = config as StockQuotesConfig | undefined;
  const title = stockConfig?.title?.trim() || 'Stock Quotes';
  const symbols =
    Array.isArray(stockConfig?.symbols) && stockConfig.symbols.length > 0
      ? stockConfig.symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_SYMBOLS;
  const range = stockConfig?.range ?? '6mo';
  const refreshInterval = stockConfig?.refreshInterval ?? 10;
  const showChart = stockConfig?.showChart ?? true;
  const showChange = stockConfig?.showChange ?? true;
  const showNames = stockConfig?.showNames ?? true;

  const { containerRef, scale } = useFitScale(420, 260);
  const [quotes, setQuotes] = useState<Quote[]>(DEMO_QUOTES);
  const [chart, setChart] = useState<ChartPoint[]>(DEMO_CHART);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const chartSymbol =
    stockConfig?.chartSymbol?.trim().toUpperCase() ||
    symbols[0] ||
    DEMO_QUOTES[0].symbol;

  const fetchStocks = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes(DEMO_QUOTES);
      setChart(DEMO_CHART);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        symbols: symbols.join(','),
        chart: chartSymbol,
        range,
      });
      const url = `/api/stocks?${params.toString()}`;
      const { data } = await fetchJsonWithCache<StocksResponse>(url, {
        cacheKey: buildCacheKey('stock-quotes', url),
        ttlMs: refreshInterval * 60 * 1000,
      });

      if (!data.quotes || data.quotes.length === 0) {
        throw new Error('No quote data returned');
      }

      setQuotes(data.quotes);
      setChart(data.chart && data.chart.length > 1 ? data.chart : DEMO_CHART);
      setError(null);
    } catch (fetchError) {
      setQuotes(DEMO_QUOTES);
      setChart(DEMO_CHART);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load quotes');
    } finally {
      setLoading(false);
    }
  }, [chartSymbol, range, refreshInterval, symbols]);

  useEffect(() => {
    fetchStocks();
    const interval = window.setInterval(fetchStocks, refreshInterval * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [fetchStocks, refreshInterval]);

  const leadQuote = useMemo(
    () => quotes.find((quote) => quote.symbol === chartSymbol) ?? quotes[0] ?? DEMO_QUOTES[0],
    [chartSymbol, quotes],
  );

  const positive = leadQuote.changePercent >= 0;
  const headlineColor = mixColors(theme.background, '#ffffff', 0.96);
  const mutedColor = mixColors(theme.background, '#ffffff', 0.64);
  const subtleColor = mixColors(theme.background, '#ffffff', 0.42);
  const surfaceColor = `${theme.primary}2a`;
  const listSurface = `${theme.primary}22`;
  const negativeColor = mixColors(theme.background, '#ff5a5a', 0.88);
  const trendColor = positive ? theme.accent : negativeColor;
  const trendFill = positive ? `${theme.accent}26` : `${negativeColor}26`;

  return (
    <DarkContainer ref={containerRef} bg={theme.background}>
      <div
        style={{
          width: 420,
          height: 260,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          padding: 18,
        }}
      >
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: headlineColor,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 11, color: mutedColor }}>
                {symbols.join(' • ')}
              </div>
            </div>
            <div
              style={{
                border: `1px solid ${theme.accent}33`,
                color: theme.accent,
                background: `${theme.accent}10`,
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {rangeLabel(range)}
            </div>
          </div>

          <div className="flex flex-1 gap-3">
            <div
              className="flex min-w-0 flex-1 flex-col rounded-[20px]"
              style={{
                background: surfaceColor,
                border: `1px solid ${theme.accent}18`,
                padding: 14,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {leadQuote.symbol}
                  </div>
                  {showNames && (
                    <div style={{ fontSize: 12, color: subtleColor, marginTop: 2 }}>
                      {leadQuote.name}
                    </div>
                  )}
                </div>
                {showChange && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: trendColor,
                      textAlign: 'right',
                    }}
                  >
                    <div>{formatSignedNumber(leadQuote.change)}</div>
                    <div>{formatSignedPercent(leadQuote.changePercent)}</div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: headlineColor, marginTop: 10 }}>
                {formatPrice(leadQuote.price)}
              </div>

              <div className="mt-3 flex-1">
                {showChart ? (
                  <Sparkline points={chart} stroke={trendColor} fill={trendFill} />
                ) : (
                  <div
                    className="flex h-full items-center justify-center rounded-[16px]"
                    style={{ background: `${theme.primary}24`, color: subtleColor, fontSize: 12 }}
                  >
                    Chart hidden
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-[146px] flex-col gap-2">
              {quotes.slice(0, 4).map((quote) => {
                const rowPositive = quote.changePercent >= 0;
                return (
                  <div
                    key={quote.symbol}
                    className="rounded-[18px]"
                    style={{
                      background: listSurface,
                      border: `1px solid ${quote.symbol === leadQuote.symbol ? theme.accent : `${theme.primary}30`}`,
                      padding: '10px 12px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div style={{ fontSize: 12, fontWeight: 700, color: headlineColor }}>
                        {quote.symbol}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: rowPositive ? theme.accent : negativeColor,
                        }}
                      >
                        {formatSignedPercent(quote.changePercent)}
                      </div>
                    </div>
                    {showNames && (
                      <div style={{ fontSize: 10, color: subtleColor, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {quote.name}
                      </div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 700, color: headlineColor, marginTop: 4 }}>
                      {formatPrice(quote.price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between" style={{ fontSize: 11, color: subtleColor }}>
            <span>{loading ? 'Refreshing quotes...' : error ? `Fallback data • ${error}` : 'Live price snapshot'}</span>
            <span>Updates every {refreshInterval}m</span>
          </div>
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'stock-quotes',
  name: 'Stock Quotes',
  description: 'Track multiple stock symbols with a lead trend chart.',
  icon: 'arrowLeftRight',
  minW: 2,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  component: StockQuotes,
  OptionsComponent: StockQuotesOptions,
  defaultProps: {
    title: 'Stock Quotes',
    symbols: DEFAULT_SYMBOLS,
    chartSymbol: 'NVDA',
    range: '6mo',
    refreshInterval: 10,
    showChart: true,
    showChange: true,
    showNames: true,
  },
});
