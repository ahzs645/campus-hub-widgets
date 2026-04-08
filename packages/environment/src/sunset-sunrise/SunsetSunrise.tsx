'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { fetchJsonWithCache, buildCacheKey } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale, ThemedContainer, IconText } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import SunsetSunriseOptions from './SunsetSunriseOptions';

interface SunriseSunsetConfig {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  timeFormat?: '12h' | '24h';
  showDetails?: boolean;
  refreshInterval?: number; // minutes
}

interface SunData {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: string;
  civilTwilightBegin: string;
  civilTwilightEnd: string;
  goldenHour: string;
}

interface APIResponse {
  results: {
    sunrise: string;
    sunset: string;
    solar_noon: string;
    day_length: string;
    civil_twilight_begin: string;
    civil_twilight_end: string;
  };
  status: string;
}

const formatTime = (utcStr: string, format: '12h' | '24h'): string => {
  const date = new Date(utcStr);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  });
};

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Calculate sun progress (0-1) through the day based on sunrise/sunset */
const getSunProgress = (sunrise: string, sunset: string): number => {
  const now = Date.now();
  const rise = new Date(sunrise).getTime();
  const set = new Date(sunset).getTime();
  if (isNaN(rise) || isNaN(set)) return 0.5;
  if (now <= rise) return 0;
  if (now >= set) return 1;
  return (now - rise) / (set - rise);
};

/** Estimate golden hour as ~1 hour before sunset */
const estimateGoldenHour = (sunset: string): string => {
  const d = new Date(sunset);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - 60);
  return d.toISOString();
};

const SunArc = ({
  progress,
  isDaytime,
  theme,
  width,
  height,
}: {
  progress: number;
  isDaytime: boolean;
  theme: { primary: string; accent: string };
  width: number;
  height: number;
}) => {
  const cx = width / 2;
  const ry = height * 0.7;
  const rx = (width - 40) / 2;
  const baseY = height - 8;

  // Arc path (semi-ellipse above baseline)
  const arcPath = `M ${cx - rx} ${baseY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${baseY}`;

  // Sun position along the arc
  const angle = Math.PI * (1 - progress);
  const sunX = cx + rx * Math.cos(angle);
  const sunY = baseY - ry * Math.sin(angle);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Horizon line */}
      <line
        x1={cx - rx - 5}
        y1={baseY}
        x2={cx + rx + 5}
        y2={baseY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      {/* Arc path */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {/* Traveled portion of arc */}
      {isDaytime && progress > 0 && progress < 1 && (
        <path
          d={arcPath}
          fill="none"
          stroke={theme.accent}
          strokeWidth={2}
          strokeDasharray={`${progress * Math.PI * ((rx + ry) / 2)} 9999`}
          opacity={0.6}
        />
      )}
      {/* Sun circle */}
      {isDaytime && progress > 0 && progress < 1 && (
        <>
          <circle cx={sunX} cy={sunY} r={12} fill={theme.accent} opacity={0.2} />
          <circle cx={sunX} cy={sunY} r={7} fill={theme.accent} opacity={0.8} />
        </>
      )}
      {/* Sunrise / Sunset labels */}
      <text x={cx - rx} y={baseY - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={10}>
        ↑
      </text>
      <text x={cx + rx} y={baseY - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={10}>
        ↓
      </text>
    </svg>
  );
};

const MOCK_DATA: SunData = {
  sunrise: new Date(new Date().setHours(6, 45, 0)).toISOString(),
  sunset: new Date(new Date().setHours(19, 20, 0)).toISOString(),
  solarNoon: new Date(new Date().setHours(13, 2, 0)).toISOString(),
  dayLength: formatDuration(45300),
  civilTwilightBegin: new Date(new Date().setHours(6, 15, 0)).toISOString(),
  civilTwilightEnd: new Date(new Date().setHours(19, 50, 0)).toISOString(),
  goldenHour: new Date(new Date().setHours(18, 20, 0)).toISOString(),
};

export default function SunsetSunrise({ config, theme }: WidgetComponentProps) {
  const cfg = config as SunriseSunsetConfig | undefined;
  const lat = cfg?.latitude ?? 48.8566;
  const lng = cfg?.longitude ?? 2.3522;
  const locationName = cfg?.locationName ?? 'Paris';
  const timeFormat = cfg?.timeFormat ?? '12h';
  const showDetails = cfg?.showDetails ?? true;
  const refreshInterval = cfg?.refreshInterval ?? 30; // minutes

  const [sunData, setSunData] = useState<SunData>(MOCK_DATA);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0); // force re-render for live progress

  const refreshMs = refreshInterval * 60 * 1000;

  const fetchSunData = useCallback(async () => {
    try {
      setError(null);
      const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`;
      const { data } = await fetchJsonWithCache<APIResponse>(url, {
        cacheKey: buildCacheKey('sunset-sunrise', `${lat}:${lng}`),
        ttlMs: refreshMs,
      });

      if (data?.status === 'OK' && data.results) {
        const r = data.results;
        const sunsetDate = new Date(r.sunset);
        const dayLenMatch = r.day_length;
        const dayLenSec = typeof dayLenMatch === 'number'
          ? dayLenMatch
          : parseInt(String(dayLenMatch), 10) || 0;

        setSunData({
          sunrise: r.sunrise,
          sunset: r.sunset,
          solarNoon: r.solar_noon,
          dayLength: formatDuration(dayLenSec),
          civilTwilightBegin: r.civil_twilight_begin,
          civilTwilightEnd: r.civil_twilight_end,
          goldenHour: estimateGoldenHour(r.sunset),
        });
      } else {
        setError('Unable to fetch sun data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [lat, lng, refreshMs]);

  useEffect(() => {
    fetchSunData();
    const interval = setInterval(fetchSunData, refreshMs);
    return () => clearInterval(interval);
  }, [fetchSunData, refreshMs]);

  // Tick every minute for live sun position
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const progress = useMemo(
    () => getSunProgress(sunData.sunrise, sunData.sunset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sunData.sunrise, sunData.sunset, Math.floor(Date.now() / 60_000)],
  );
  const isDaytime = progress > 0 && progress < 1;

  const { containerRef, containerWidth, containerHeight, isLandscape } = useAdaptiveFitScale({
    landscape: { w: 360, h: 260 },
    portrait: { w: 240, h: 360 },
  });
  const resolvedWidth = containerWidth || (isLandscape ? 360 : 240);
  const resolvedHeight = containerHeight || (isLandscape ? 260 : 360);
  const compact = resolvedHeight < 210 || resolvedWidth < 310;
  const showCompactDetails = showDetails && !compact;
  const padX = clamp(resolvedWidth * 0.065, 12, 24);
  const padY = clamp(resolvedHeight * 0.07, 10, 20);
  const titleSize = clamp(Math.min(resolvedWidth * 0.052, resolvedHeight * 0.115), 11, 18);
  const statusSize = clamp(Math.min(resolvedWidth * 0.06, resolvedHeight * 0.13), 12, 20);
  const labelSize = clamp(Math.min(resolvedWidth * 0.044, resolvedHeight * 0.102), 11, 15);
  const valueSize = clamp(Math.min(resolvedWidth * 0.08, resolvedHeight * 0.19), 20, 38);
  const metaSize = clamp(Math.min(resolvedWidth * 0.038, resolvedHeight * 0.09), 10, 13);
  const twilightSize = clamp(metaSize * 0.92, 9, 12);
  const contentGap = clamp(resolvedHeight * 0.025, 6, 12);
  const arcWidth = clamp(resolvedWidth - padX * 2 - (compact ? 8 : 20), 160, 280);
  const arcHeight = clamp(resolvedHeight * (compact ? 0.2 : 0.24), 54, 84);
  const timesGap = clamp(resolvedWidth * (compact ? 0.035 : 0.06), 12, 30);
  const detailGapX = clamp(resolvedWidth * 0.045, 10, 20);
  const detailGapY = clamp(resolvedHeight * 0.02, 4, 10);
  const primaryMetaSize = clamp(metaSize * 1.02, 10, 14);

  const timeUntil = useMemo(() => {
    const now = Date.now();
    const rise = new Date(sunData.sunrise).getTime();
    const set = new Date(sunData.sunset).getTime();
    if (now < rise) {
      const diff = rise - now;
      return `Sunrise in ${formatDuration(diff / 1000)}`;
    }
    if (now < set) {
      const diff = set - now;
      return `Sunset in ${formatDuration(diff / 1000)}`;
    }
    return 'Sun has set';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sunData.sunrise, sunData.sunset, Math.floor(Date.now() / 60_000)]);

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="20"
      className="flex items-center justify-center"
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center text-center"
        style={{ padding: `${padY}px ${padX}px`, gap: contentGap }}
      >
        {/* Location */}
        <div
          className="font-medium opacity-70"
          style={{ color: theme.accent, fontSize: titleSize, lineHeight: 1.05 }}
        >
          {locationName}
        </div>

        {/* Status line */}
        <div
          className="text-white/60"
          style={{ fontSize: statusSize, lineHeight: 1.08, maxWidth: '100%' }}
        >
          {timeUntil}
        </div>

        {/* Sun arc */}
        <div className="flex w-full justify-center">
          <SunArc
            progress={progress}
            isDaytime={isDaytime}
            theme={theme}
            width={arcWidth}
            height={arcHeight}
          />
        </div>

        {/* Sunrise / Sunset times */}
        <div
          className="flex w-full flex-wrap justify-center"
          style={{ gap: timesGap }}
        >
          <div className="flex flex-col items-center">
            <IconText icon={<AppIcon name="sunrise" className="w-5 h-5 text-amber-400" />} gap="1.5">
              <span className="font-medium text-white/80" style={{ fontSize: labelSize, lineHeight: 1.1 }}>
                Sunrise
              </span>
            </IconText>
            <span className="font-bold text-white" style={{ fontSize: valueSize, lineHeight: 1, marginTop: 2 }}>
              {formatTime(sunData.sunrise, timeFormat)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <IconText icon={<AppIcon name="sunset" className="w-5 h-5 text-orange-400" />} gap="1.5">
              <span className="font-medium text-white/80" style={{ fontSize: labelSize, lineHeight: 1.1 }}>
                Sunset
              </span>
            </IconText>
            <span className="font-bold text-white" style={{ fontSize: valueSize, lineHeight: 1, marginTop: 2 }}>
              {formatTime(sunData.sunset, timeFormat)}
            </span>
          </div>
        </div>

        {/* Details */}
        {showDetails && compact && (
          <div
            className="flex w-full justify-center text-white/55"
            style={{ fontSize: primaryMetaSize, lineHeight: 1.15 }}
          >
            <IconText icon={<AppIcon name="clock" className="w-3.5 h-3.5" />} gap="1.5">
              <span>{sunData.dayLength} daylight</span>
            </IconText>
          </div>
        )}

        {showCompactDetails && (
          <div
            className="flex w-full flex-wrap justify-center text-white/50"
            style={{ columnGap: detailGapX, rowGap: detailGapY, fontSize: metaSize, lineHeight: 1.15 }}
          >
            <IconText icon={<AppIcon name="clock" className="w-3.5 h-3.5" />} gap="1.5">
              <span>{sunData.dayLength} daylight</span>
            </IconText>
            <IconText icon={<AppIcon name="sun" className="w-3.5 h-3.5" />} gap="1.5">
              <span>Noon {formatTime(sunData.solarNoon, timeFormat)}</span>
            </IconText>
            {sunData.goldenHour && (
              <IconText icon={<AppIcon name="camera" className="w-3.5 h-3.5" />} gap="1.5">
                <span>Golden {formatTime(sunData.goldenHour, timeFormat)}</span>
              </IconText>
            )}
          </div>
        )}

        {/* Twilight */}
        {showCompactDetails && (
          <div
            className="flex w-full justify-center text-white/35"
            style={{ fontSize: twilightSize, lineHeight: 1.1 }}
          >
            <span className="max-w-full text-center">
              Twilight {formatTime(sunData.civilTwilightBegin, timeFormat)} – {formatTime(sunData.civilTwilightEnd, timeFormat)}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-400 truncate">{error}</div>
        )}
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'sunset-sunrise',
  name: 'Sunset / Sunrise',
  description: 'Display local sunset and sunrise times',
  icon: 'sunrise',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 2,
  component: SunsetSunrise,
  OptionsComponent: SunsetSunriseOptions,
  defaultProps: {
    latitude: 48.8566,
    longitude: 2.3522,
    locationName: 'Paris',
    timeFormat: '12h',
    showDetails: true,
    refreshInterval: 30,
  },
});
