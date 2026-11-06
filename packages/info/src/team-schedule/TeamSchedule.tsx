'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DarkContainer, buildCacheKey, buildProxyUrl, fetchJsonWithCache, type WidgetComponentProps, useFitScale, useLoopingAutoScroll, useWidgetPreview } from '@firstform/campus-hub-widget-sdk';
import { SourceUnavailable } from '@firstform/campus-hub-widgets-shared';

interface TeamScheduleConfig {
  title?: string;
  teamName?: string;
  league?: string;
  source?: 'demo' | 'manual' | 'url';
  apiUrl?: string;
  manualData?: string;
  maxGames?: number;
  showVenue?: boolean;
  showStatus?: boolean;
  refreshInterval?: number;
  useCorsProxy?: boolean;
}

interface TeamGame {
  date: string;
  opponent: string;
  home: boolean;
  time?: string;
  venue?: string;
  status?: string;
  note?: string;
}

const DEMO_OPPONENTS = [
  'Los Angeles Lakers',
  'Golden State Warriors',
  'Denver Nuggets',
  'Sacramento Kings',
  'Minnesota Timberwolves',
  'Dallas Mavericks',
  'LA Clippers',
];

function makeDemoGames(nowMs: number): TeamGame[] {
  const now = new Date(nowMs);
  return DEMO_OPPONENTS.map((opponent, index) => {
    const gameDate = new Date(now);
    gameDate.setDate(now.getDate() + index * 2 + 1);
    gameDate.setHours(19 + (index % 2), index % 2 === 0 ? 0 : 30, 0, 0);
    const home = index % 2 === 0;

    return {
      date: gameDate.toISOString(),
      opponent,
      home,
      time: gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      venue: home ? 'Footprint Center' : 'Road Game',
      status: index === 0 ? 'Next Up' : 'Scheduled',
      note: home ? 'Home stand' : 'Away swing',
    };
  });
}

const DEMO_REFRESH_MS = 60 * 60 * 1000;

/**
 * Parse a game date. A date-only value ("2026-10-21") is a calendar day, so
 * it is read as local midnight; `new Date('2026-10-21')` would be UTC
 * midnight and show the previous day west of UTC.
 */
function parseGameDate(date: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(date);
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

  const clamp = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clamp);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

function parseHome(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'home' || normalized === 'vs' || normalized === 'v';
}

function normalizeGame(value: unknown): TeamGame | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const date = typeof raw.date === 'string' ? raw.date : '';
  const opponent = typeof raw.opponent === 'string' ? raw.opponent : '';
  if (!date || !opponent) return null;

  return {
    date,
    opponent,
    home: typeof raw.home === 'boolean' ? raw.home : parseHome(raw.home),
    time: typeof raw.time === 'string' ? raw.time : undefined,
    venue: typeof raw.venue === 'string' ? raw.venue : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    note: typeof raw.note === 'string' ? raw.note : undefined,
  };
}

function parseManualData(text: string): TeamGame[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const contentLines =
    lines[0]?.toLowerCase().startsWith('date,') ? lines.slice(1) : lines;

  return contentLines
    .map((line) => line.split(',').map((part) => part.trim()))
    .map((parts) => normalizeGame({
      date: parts[0],
      opponent: parts[1],
      home: parts[2],
      time: parts[3],
      venue: parts[4],
      status: parts[5],
      note: parts[6],
    }))
    .filter((game): game is TeamGame => Boolean(game));
}

function sortGames(games: TeamGame[]): TeamGame[] {
  return [...games].sort((left, right) => {
    const leftTime = parseGameDate(left.date).getTime();
    const rightTime = parseGameDate(right.date).getTime();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0;
    return leftTime - rightTime;
  });
}

function formatDate(date: string): string {
  const parsed = parseGameDate(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function formatMatchup(game: TeamGame): string {
  return `${game.home ? 'vs' : '@'} ${game.opponent}`;
}

export default function TeamSchedule({ config, theme }: WidgetComponentProps) {
  const scheduleConfig = config as TeamScheduleConfig | undefined;
  const preview = useWidgetPreview();
  const title = scheduleConfig?.title?.trim() || 'Team Schedule';
  const teamName = scheduleConfig?.teamName?.trim() || 'Phoenix Suns';
  const league = scheduleConfig?.league?.trim() || 'NBA';
  const source = preview ? 'demo' : scheduleConfig?.source ?? 'demo';
  const apiUrl = scheduleConfig?.apiUrl?.trim() || '';
  const manualData = scheduleConfig?.manualData?.trim() || '';
  const maxGames = Math.max(1, Math.min(8, scheduleConfig?.maxGames ?? 5));
  const showVenue = scheduleConfig?.showVenue ?? true;
  const showStatus = scheduleConfig?.showStatus ?? true;
  const refreshInterval = scheduleConfig?.refreshInterval ?? 30;
  const useCorsProxy = scheduleConfig?.useCorsProxy ?? true;

  const { containerRef, scale } = useFitScale(420, 260);
  // demo: no schedule configured — sample games with a visible badge.
  // manual: the pasted schedule (invalid rows are an error, never samples).
  // url: last-good games from this URL; on failure with nothing good to
  // show, an unavailable state instead of sample games.
  const isDemo =
    source === 'demo' ||
    (source === 'url' && !apiUrl) ||
    (source === 'manual' && !manualData);
  const fetchUrl = source === 'url' && apiUrl ? (useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl) : '';
  const [live, setLive] = useState<{ key: string; games: TeamGame[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Demo dates are relative to "now"; recompute them periodically so a
  // 24/7 display does not drift into showing past games.
  const [demoEpoch, setDemoEpoch] = useState(() => Date.now());

  useEffect(() => {
    if (!isDemo) return undefined;
    const interval = window.setInterval(() => setDemoEpoch(Date.now()), DEMO_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [isDemo]);

  const manualGames = useMemo(
    () => (source === 'manual' && manualData ? sortGames(parseManualData(manualData)) : []),
    [manualData, source],
  );

  const loadGames = useCallback(async () => {
    if (!fetchUrl) {
      setError(null);
      return;
    }

    try {
      const { data } = await fetchJsonWithCache<unknown>(fetchUrl, {
        cacheKey: buildCacheKey('team-schedule', fetchUrl),
        ttlMs: refreshInterval * 60 * 1000,
      });

      const rawGames = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray((data as { games?: unknown[] }).games)
          ? (data as { games: unknown[] }).games
          : [];

      const parsed = sortGames(
        rawGames
          .map((entry) => normalizeGame(entry))
          .filter((game): game is TeamGame => Boolean(game)),
      );

      if (parsed.length === 0) {
        throw new Error('No valid games returned');
      }

      setLive({ key: fetchUrl, games: parsed });
      setError(null);
    } catch (fetchError) {
      // Keep last-good games; never fall back to the demo schedule.
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load schedule');
    }
  }, [fetchUrl, refreshInterval]);

  useEffect(() => {
    loadGames();
    if (!fetchUrl) return undefined;

    const interval = window.setInterval(loadGames, refreshInterval * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [fetchUrl, loadGames, refreshInterval]);

  const demoGames = useMemo(() => (isDemo ? makeDemoGames(demoEpoch) : []), [isDemo, demoEpoch]);
  const currentLive = fetchUrl && live?.key === fetchUrl ? live : null;
  const games: TeamGame[] = isDemo
    ? demoGames
    : source === 'manual'
      ? manualGames
      : currentLive?.games ?? [];
  const sourceError =
    source === 'manual' && !isDemo && manualGames.length === 0
      ? 'No valid games in the manual schedule'
      : error;
  const isUnavailable = !isDemo && games.length === 0 && sourceError !== null;
  const isLoading = !isDemo && games.length === 0 && sourceError === null;

  const upcoming = useMemo(() => sortGames(games).slice(0, maxGames), [games, maxGames]);
  const gamesRef = useLoopingAutoScroll<HTMLDivElement>([
    upcoming,
    showStatus,
    showVenue,
  ]);
  const nextGame = upcoming[0];
  const headlineColor = mixColors(theme.background, '#ffffff', 0.95);
  const mutedColor = mixColors(theme.background, '#ffffff', 0.65);
  const subtleColor = mixColors(theme.background, '#ffffff', 0.4);

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
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: headlineColor }}>
                {title}
              </div>
              <div style={{ fontSize: 11, color: mutedColor }}>
                {teamName} • {league}
              </div>
            </div>
            <div
              style={{
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: theme.accent,
                border: `1px solid ${theme.accent}33`,
                background: `${theme.accent}10`,
              }}
            >
              {isDemo ? 'Demo' : `${upcoming.length} games`}
            </div>
          </div>

          {isUnavailable ? (
            <div className="min-h-0 flex-1">
              <SourceUnavailable label="Schedule" detail={sourceError} />
            </div>
          ) : isLoading || !nextGame ? (
            <div className="flex min-h-0 flex-1 items-center justify-center" style={{ fontSize: 12, color: subtleColor }}>
              Loading schedule…
            </div>
          ) : (
            <>
          <div
            className="rounded-[22px]"
            style={{
              background: `${theme.primary}28`,
              border: `1px solid ${theme.accent}20`,
              padding: 14,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  {nextGame.status || 'Next Up'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: headlineColor, marginTop: 6 }}>
                  {formatMatchup(nextGame)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: headlineColor }}>{formatDate(nextGame.date)}</div>
                <div style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>{nextGame.time || 'TBD'}</div>
              </div>
            </div>

            {(showVenue || nextGame.note) && (
              <div style={{ fontSize: 12, color: mutedColor, marginTop: 10 }}>
                {showVenue && nextGame.venue ? nextGame.venue : ''}
                {showVenue && nextGame.venue && nextGame.note ? ' • ' : ''}
                {nextGame.note || ''}
              </div>
            )}
          </div>

          <div
            ref={gamesRef}
            data-layout-diagnostic-ignore="true"
            className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-hide"
          >
            {upcoming.slice(1).map((game) => (
              <div
                key={`${game.date}-${game.opponent}`}
                className="flex items-center justify-between rounded-[16px]"
                style={{
                  background: `${theme.primary}1e`,
                  padding: '10px 12px',
                  border: `1px solid ${theme.primary}33`,
                }}
              >
                <div className="min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 700, color: headlineColor }}>
                    {formatMatchup(game)}
                  </div>
                  <div style={{ fontSize: 11, color: subtleColor, marginTop: 3 }}>
                    {formatDate(game.date)}
                    {showVenue && game.venue ? ` • ${game.venue}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: headlineColor }}>
                    {game.time || 'TBD'}
                  </div>
                  {showStatus && (
                    <div style={{ fontSize: 10, color: theme.accent, marginTop: 3 }}>
                      {game.status || 'Scheduled'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

            </>
          )}

          <div className="mt-2 flex items-center justify-between" style={{ fontSize: 11, color: subtleColor }}>
            <span>{source === 'url' ? `Refreshes every ${refreshInterval}m` : 'Editable schedule widget'}</span>
            <span className="min-w-0 truncate pl-2">
              {isDemo ? 'Sample schedule' : sourceError && !isUnavailable ? `Refresh failed • ${sourceError}` : source === 'manual' ? 'Manual schedule' : 'Live schedule'}
            </span>
          </div>
        </div>
      </div>
    </DarkContainer>
  );
}

