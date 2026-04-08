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

  const chartPath = data?.chart.length
    ? buildLinePath(data.chart, 320, 120)
    : '';

  if (!symbols.length) {
    return (
      <div
        className="flex h-full min-h-0 items-center justify-center rounded-[20px]"
        style={{
          background: 'linear-gradient(180deg, #1B3A5C 0%, #0F2844 40%, #0A1E36 100%)',
          boxShadow:
            '0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)',
        }}
      >
        <EmptyState
          title="Add some symbols"
          description="Enter comma-separated tickers in the widget settings."
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px]"
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        background: 'linear-gradient(180deg, #1B3A5C 0%, #0F2844 40%, #0A1E36 100%)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      {error ? (
        <div className="flex h-full min-h-0 items-center justify-center px-4 text-center text-[12px] text-white/55">
          {error}
        </div>
      ) : (
        <>
          <div className="shrink-0 px-1 pt-1.5">
            {(data?.quotes ?? []).map((quote, index) => {
              const isFirst = index === 0;
              const isSelected = selectedSymbol === quote.symbol;
              return (
                <button
                  key={quote.symbol}
                  type="button"
                  className="flex w-full items-center px-2 text-left transition-colors"
                  style={{
                    height: isFirst ? 32 : 28,
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderRadius: isSelected ? 6 : 0,
                    borderBottom:
                      !isSelected && index < (data?.quotes.length ?? 0) - 1
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid transparent',
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setSelectedSymbol(quote.symbol)}
                >
                  <span
                    className="font-bold"
                    style={{
                      fontSize: isFirst ? 15 : 14,
                      color: 'rgba(255,255,255,0.9)',
                      width: 58,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {quote.symbol.startsWith('^') ? quote.symbol.slice(1) : quote.symbol}
                  </span>
                  <span
                    className="flex-1 text-right font-medium"
                    style={{
                      fontSize: isFirst ? 15 : 14,
                      color: 'rgba(255,255,255,0.85)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {quote.price.toFixed(2)}
                  </span>
                  <span
                    className="font-bold text-right"
                    style={{
                      fontSize: isFirst ? 13 : 12,
                      width: 56,
                      marginLeft: 6,
                      padding: '1px 5px',
                      borderRadius: 3,
                      color: '#FFF',
                      background:
                        quote.change >= 0
                          ? 'linear-gradient(180deg, #3DA03D 0%, #2D7E2D 100%)'
                          : 'linear-gradient(180deg, #D94040 0%, #B52F2F 100%)',
                    }}
                  >
                    {quote.change >= 0 ? '+' : ''}
                    {quote.change.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pt-1.5 pb-1.5">
            <div className="mb-1 flex items-center justify-center gap-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setRange(option.value)}
                  style={{
                    fontSize: 11,
                    fontWeight: range === option.value ? 700 : 400,
                    color: range === option.value ? '#FFF' : 'rgba(255,255,255,0.45)',
                    background:
                      range === option.value ? 'rgba(255,255,255,0.15)' : 'transparent',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-1 items-end justify-center">
              {chartPath ? (
                <svg viewBox="0 0 320 120" className="block h-28 w-full">
                  <defs>
                    <linearGradient id="macos-stocks-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                      <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.15" />
                      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${chartPath} L 320 120 L 0 120 Z`}
                    fill="url(#macos-stocks-fill)"
                  />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : data ? (
                <div className="flex h-28 items-center justify-center text-sm text-white/35">
                  History unavailable
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-sm text-white/45">
                  Loading chart…
                </div>
              )}
            </div>

            <div
              className="mt-1 text-center"
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.02em',
              }}
            >
              Delayed
            </div>
          </div>
        </>
      )}
    </div>
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
