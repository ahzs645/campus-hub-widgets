'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchJsonWithCache, getCorsProxyUrl } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale, ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import GroundwaterLevelOptions from './GroundwaterLevelOptions';

interface GroundwaterConfig {
  locationId?: string;
  datasetId?: string;
  displayMode?: 'current' | 'history';
  refreshInterval?: number;
  useCorsProxy?: boolean;
}

/** Response shape from the WebPortal DatasetGrid endpoint. */
interface DatasetGridResponse {
  Data?: { TimeStamp: string; Value: number; DisplayValue?: string }[];
  Total?: number;
}

interface GwData {
  locationId: string;
  dataSetLabel: string;
  currentLevel: number | null;
  unit: string;
  timestamp: string | null;
  history: { time: string; value: number }[];
}

const WEBPORTAL_BASE = 'https://bcmoe-prod.aquaticinformatics.net';

/** Known dataset IDs — maps locationId to the numeric DatasetGrid id. */
const KNOWN_DATASETS: Record<string, number> = {
  OW378: 11130,
};

const MOCK_DATA: GwData = {
  locationId: 'OW378',
  dataSetLabel: 'Groundwater Level (SGWL)',
  currentLevel: 35.105,
  unit: 'm',
  timestamp: new Date().toISOString(),
  history: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value: 35.0 + Math.sin(i / 4) * 0.3 + Math.random() * 0.05,
  })),
};

/**
 * Parse the WebPortal HTML page for the latest groundwater reading.
 * This is a fallback when the Publish API is not accessible.
 */

/** Build a simple SVG sparkline from data points. */
function Sparkline({
  data,
  width,
  height,
  color,
}: {
  data: number[];
  width: number;
  height: number;
  color: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableH = height - padding * 2;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Area fill
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block"
    >
      <polygon points={areaPoints} fill={`${color}20`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Latest point dot */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) * stepX}
          cy={
            padding +
            usableH -
            ((data[data.length - 1] - min) / range) * usableH
          }
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  );
}

export default function GroundwaterLevel({
  config,
  theme,
}: WidgetComponentProps) {
  const cfg = config as GroundwaterConfig | undefined;
  const locationId = cfg?.locationId?.trim() || 'OW378';
  const datasetId = cfg?.datasetId?.trim() || '';
  const displayMode = cfg?.displayMode ?? 'current';
  const refreshInterval = cfg?.refreshInterval ?? 30;
  const useCorsProxy = cfg?.useCorsProxy ?? true;

  const [data, setData] = useState<GwData>(MOCK_DATA);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshMs = refreshInterval * 60 * 1000;

  const fetchData = useCallback(async () => {
    if (!useCorsProxy || !getCorsProxyUrl()) {
      setData({ ...MOCK_DATA, locationId });
      return;
    }

    try {
      setError(null);

      // Resolve the numeric dataset ID
      const numericId = datasetId
        ? Number(datasetId)
        : KNOWN_DATASETS[locationId.toUpperCase()];

      if (!numericId) {
        setError(`Unknown well ${locationId} — set a dataset ID in config`);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      // Fetch latest reading (single row)
      const latestUrl =
        `${WEBPORTAL_BASE}/Data/DatasetGrid` +
        `?dataset=${numericId}&sort=TimeStamp-desc&page=1&pageSize=1` +
        `&interval=Latest&timezone=0&date=${today}&alldata=false`;

      const { data: latestResp } = await fetchJsonWithCache<DatasetGridResponse>(
        buildProxyUrl(latestUrl),
        { cacheKey: buildCacheKey('gw-latest', `${numericId}`), ttlMs: refreshMs },
      );

      const latestRow = latestResp?.Data?.[0];

      // Fetch recent history (last 168 points ≈ 7 days hourly)
      const histUrl =
        `${WEBPORTAL_BASE}/Data/DatasetGrid` +
        `?dataset=${numericId}&sort=TimeStamp-desc&page=1&pageSize=168` +
        `&interval=Latest&timezone=0&date=${today}&alldata=false`;

      const { data: histResp } = await fetchJsonWithCache<DatasetGridResponse>(
        buildProxyUrl(histUrl),
        { cacheKey: buildCacheKey('gw-hist', `${numericId}`), ttlMs: refreshMs },
      );

      const history = (histResp?.Data ?? [])
        .filter((r) => r.Value != null)
        .map((r) => ({ time: r.TimeStamp, value: r.Value }))
        .reverse(); // oldest first for sparkline

      setData({
        locationId,
        dataSetLabel: 'Groundwater Level (SGWL)',
        currentLevel: latestRow?.Value ?? null,
        unit: 'm',
        timestamp: latestRow?.TimeStamp ?? null,
        history,
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [locationId, datasetId, refreshMs, useCorsProxy]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!isMounted) return;
      await fetchData();
    };
    run();
    const interval = setInterval(run, refreshMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData, refreshMs]);

  const { containerRef, scale, designWidth: DESIGN_W, designHeight: DESIGN_H, isLandscape } = useAdaptiveFitScale({
    landscape: { w: 340, h: 280 },
    portrait: { w: 240, h: 380 },
  });

  const levelDisplay =
    data.currentLevel != null ? data.currentLevel.toFixed(3) : '—';

  const historyValues = data.history.map((h) => h.value);
  const trend =
    historyValues.length >= 2
      ? historyValues[historyValues.length - 1] - historyValues[historyValues.length - 2]
      : 0;
  const trendArrow = trend > 0.001 ? '\u2191' : trend < -0.001 ? '\u2193' : '\u2192';

  const showHistory = displayMode === 'history' && historyValues.length >= 2;

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="20"
      className="flex items-center justify-center"
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className={`flex flex-col p-6 ${!isLandscape ? 'items-center' : ''}`}
      >
        {/* Header */}
        <div
          className={`text-sm font-medium opacity-70 mb-1 ${!isLandscape ? 'text-center' : ''}`}
          style={{ color: theme.accent }}
        >
          {data.locationId} &mdash; Groundwater
        </div>

        {/* Main level display */}
        <div className={`flex ${isLandscape ? 'items-center gap-5' : 'flex-col items-center gap-3'} mb-3`}>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${theme.accent}30` }}
          >
            {/* Water drop SVG */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white leading-tight">
                {levelDisplay}
              </span>
              <span className="text-lg text-white/50">{data.unit}</span>
            </div>
            <div className="text-sm text-white/50 mt-0.5">
              {data.dataSetLabel}
              <span className="ml-2 text-white/40">{trendArrow}</span>
            </div>
          </div>
        </div>

        {/* History sparkline or level bar */}
        {showHistory ? (
          <div className="mb-3">
            <Sparkline
              data={historyValues}
              width={DESIGN_W - 48}
              height={60}
              color={theme.accent}
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>7d ago</span>
              <span>Now</span>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div className="h-2 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(5, (data.currentLevel ?? 0) * 10))}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        {historyValues.length > 0 && (
          <div className={`flex gap-4 text-sm text-white/60 ${!isLandscape ? 'justify-center' : ''}`}>
            <div>
              <span className="text-white/40 mr-1">Min</span>
              {Math.min(...historyValues).toFixed(2)}
            </div>
            <div>
              <span className="text-white/40 mr-1">Max</span>
              {Math.max(...historyValues).toFixed(2)}
            </div>
            <div>
              <span className="text-white/40 mr-1">Avg</span>
              {(
                historyValues.reduce((a, b) => a + b, 0) / historyValues.length
              ).toFixed(2)}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 text-sm text-red-400 truncate">{error}</div>
        )}

        {/* Last updated */}
        {lastUpdated && !error && (
          <div className="mt-auto text-sm text-white/40">
            Updated{' '}
            {lastUpdated.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'groundwater-level',
  name: 'Groundwater Level',
  description: 'BC observation well groundwater levels',
  icon: 'droplets',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: GroundwaterLevel,
  OptionsComponent: GroundwaterLevelOptions,
  defaultProps: {
    locationId: 'OW378',
    datasetId: '',
    displayMode: 'current',
    refreshInterval: 30,
    useCorsProxy: true,
  },
});
