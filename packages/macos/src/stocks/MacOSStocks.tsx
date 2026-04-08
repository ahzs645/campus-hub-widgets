'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildCacheKey,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSStocksOptions from './MacOSStocksOptions';
import {
  EmptyState,
  MACOS_MONO_FONT,
  MacOSInset,
  MacOSSegmentedControl,
  MacOSWidgetFrame,
} from '../shared/ui';

interface StocksConfig {
  symbols?: string;
  range?: '1mo' | '3mo' | '6mo' | '1y';
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
  quotes: Quote[];
  chart: ChartPoint[];
}

const RANGE_OPTIONS = [
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
] as const;

function normalizeSymbols(value?: string) {
  return (value ?? 'AAPL,MSFT,NVDA,GOOG')
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);
}

function buildLinePath(points: ChartPoint[], width: number, height: number) {
  if (!points.length) return '';
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point.close - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function shortName(symbol: string, name: string) {
  if (symbol.startsWith('^')) return symbol.slice(1);
  return name.length > 18 ? symbol : name;
}

export default function MacOSStocks({ config }: WidgetComponentProps) {
  const stocksConfig = (config ?? {}) as StocksConfig;
  const symbols = useMemo(() => normalizeSymbols(stocksConfig.symbols), [stocksConfig.symbols]);
  const [range, setRange] = useState<StocksConfig['range']>(stocksConfig.range ?? '6mo');
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0] ?? 'AAPL');
  const [data, setData] = useState<StocksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSymbol((current) => (symbols.includes(current) ? current : symbols[0] ?? 'AAPL'));
  }, [symbols]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const query = new URLSearchParams({
          symbols: symbols.join(','),
          chart: selectedSymbol,
          range: range ?? '6mo',
        });
        const { data: next } = await fetchJsonWithCache<StocksResponse>(
          `/api/stocks?${query.toString()}`,
          {
            cacheKey: buildCacheKey(
              'macos-stocks',
              `${symbols.join(',')}:${selectedSymbol}:${range}`,
            ),
            ttlMs: 5 * 60 * 1000,
          },
        );

        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Market data unavailable');
          setData(null);
        }
      }
    };

    if (symbols.length > 0) {
      void run();
    }

    const refresh = window.setInterval(run, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [range, selectedSymbol, symbols]);

  const selectedQuote =
    data?.quotes.find((quote) => quote.symbol === selectedSymbol) ?? data?.quotes[0] ?? null;
  const chartPath = data?.chart.length
    ? buildLinePath(data.chart, 320, 120)
    : '';
  const positive = (selectedQuote?.change ?? 0) >= 0;

  if (!symbols.length) {
    return (
      <MacOSWidgetFrame title="Stocks">
        <EmptyState
          title="Add some symbols"
          description="Enter comma-separated tickers in the widget settings."
        />
      </MacOSWidgetFrame>
    );
  }

  return (
    <MacOSWidgetFrame
      title="Stocks"
      subtitle={selectedSymbol}
      bodyClassName="gap-3"
      footer={
        <div className="flex items-center justify-between text-[11px] text-black/55">
          <span>Twelve Data</span>
          <MacOSSegmentedControl
            value={range ?? '6mo'}
            options={RANGE_OPTIONS as Array<{ value: StocksConfig['range']; label: string }>}
            onChange={setRange}
          />
        </div>
      }
    >
      {error ? (
        <EmptyState title="Market data unavailable" description={error} />
      ) : (
        <>
          <MacOSInset className="overflow-hidden p-3">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                  {selectedQuote ? shortName(selectedQuote.symbol, selectedQuote.name) : 'Loading'}
                </div>
                <div className="mt-1 text-[clamp(1.8rem,6vw,3rem)] leading-none font-macos-display text-[#162534]">
                  {selectedQuote ? `$${selectedQuote.price.toFixed(2)}` : '--'}
                </div>
                <div
                  className="mt-2 text-sm font-semibold"
                  style={{ color: positive ? '#1f7a38' : '#b5362a' }}
                >
                  {selectedQuote
                    ? `${positive ? '+' : ''}${selectedQuote.change.toFixed(2)} (${selectedQuote.changePercent.toFixed(2)}%)`
                    : ''}
                </div>
              </div>
              <div className="rounded-full bg-[#eef3f8] px-3 py-2 text-right text-[11px] text-black/55">
                <div className="font-semibold uppercase tracking-[0.18em]">Range</div>
                <div className="mt-1 font-macos-mono text-black/75">
                  {range?.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-[14px] border border-black/10 bg-[linear-gradient(180deg,#f5fbff_0%,#dceaf7_100%)] p-3">
              {chartPath ? (
                <svg viewBox="0 0 320 120" className="h-28 w-full">
                  <defs>
                    <linearGradient id="macos-stocks-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={positive ? '#79c484' : '#f0a39c'} stopOpacity="0.55" />
                      <stop offset="100%" stopColor={positive ? '#79c484' : '#f0a39c'} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${chartPath} L 320 120 L 0 120 Z`}
                    fill="url(#macos-stocks-fill)"
                  />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke={positive ? '#2c8b4d' : '#c84232'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="flex h-28 items-center justify-center text-sm text-black/50">
                  Loading chart…
                </div>
              )}
            </div>
          </MacOSInset>
          <div className="macos-scroll grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto">
            {(data?.quotes ?? []).map((quote) => {
              const isActive = quote.symbol === selectedSymbol;
              const rising = quote.change >= 0;
              return (
                <button
                  key={quote.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(quote.symbol)}
                  className="macos-list-row text-left"
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(212,231,255,0.96), rgba(188,215,246,0.96))'
                      : undefined,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[#1f2f42]">
                      {shortName(quote.symbol, quote.name)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-black/40">
                      {quote.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-[13px] font-semibold text-[#152634]"
                      style={{ fontFamily: MACOS_MONO_FONT }}
                    >
                      {quote.price.toFixed(2)}
                    </div>
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: rising ? '#1f7a38' : '#b5362a' }}
                    >
                      {`${rising ? '+' : ''}${quote.changePercent.toFixed(2)}%`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </MacOSWidgetFrame>
  );
}

registerWidget({
  type: 'macos-stocks',
  name: 'macOS Stocks',
  description: 'Aqua-style stock tape with quotes and trend chart',
  icon: 'coins',
  minW: 3,
  minH: 3,
  defaultW: 4,
  defaultH: 3,
  component: MacOSStocks,
  OptionsComponent: MacOSStocksOptions,
  tags: ['retro', 'info'],
  defaultProps: {
    symbols: 'AAPL,MSFT,NVDA,GOOG',
    range: '6mo',
  },
});
