'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DarkContainer,
  buildCacheKey,
  buildProxyUrl,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
  useFitScale,
} from '@firstform/campus-hub-widget-sdk';
import TeamScheduleOptions from './TeamScheduleOptions';

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

function makeDemoGames(): TeamGame[] {
  const now = new Date();
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

const DEMO_GAMES = makeDemoGames();

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
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0;
    return leftTime - rightTime;
  });
}

function formatDate(date: string): string {
  const parsed = new Date(date);
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
  const title = scheduleConfig?.title?.trim() || 'Team Schedule';
  const teamName = scheduleConfig?.teamName?.trim() || 'Phoenix Suns';
  const league = scheduleConfig?.league?.trim() || 'NBA';
  const source = scheduleConfig?.source ?? 'demo';
  const apiUrl = scheduleConfig?.apiUrl?.trim() || '';
  const manualData = scheduleConfig?.manualData?.trim() || '';
  const maxGames = Math.max(1, Math.min(8, scheduleConfig?.maxGames ?? 5));
  const showVenue = scheduleConfig?.showVenue ?? true;
  const showStatus = scheduleConfig?.showStatus ?? true;
  const refreshInterval = scheduleConfig?.refreshInterval ?? 30;
  const useCorsProxy = scheduleConfig?.useCorsProxy ?? true;

  const { containerRef, scale } = useFitScale(420, 260);
  const [games, setGames] = useState<TeamGame[]>(DEMO_GAMES);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    if (source === 'manual') {
      const parsed = sortGames(parseManualData(manualData));
      setGames(parsed.length > 0 ? parsed : DEMO_GAMES);
      setError(parsed.length > 0 ? null : 'Using demo schedule');
      return;
    }

    if (source === 'url' && apiUrl) {
      try {
        const fetchUrl = useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl;
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

        setGames(parsed);
        setError(null);
        return;
      } catch (fetchError) {
        setGames(DEMO_GAMES);
        setError(fetchError instanceof Error ? fetchError.message : 'Using demo schedule');
        return;
      }
    }

    setGames(DEMO_GAMES);
    setError(null);
  }, [apiUrl, manualData, refreshInterval, source, useCorsProxy]);

  useEffect(() => {
    loadGames();
    if (source !== 'url' || !apiUrl) return undefined;

    const interval = window.setInterval(loadGames, refreshInterval * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [apiUrl, loadGames, refreshInterval, source]);

  const upcoming = useMemo(() => sortGames(games).slice(0, maxGames), [games, maxGames]);
  const nextGame = upcoming[0] ?? DEMO_GAMES[0];
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
              {upcoming.length} games
            </div>
          </div>

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

          <div className="mt-3 flex-1 space-y-2">
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

          <div className="mt-2 flex items-center justify-between" style={{ fontSize: 11, color: subtleColor }}>
            <span>{source === 'url' ? `Refreshes every ${refreshInterval}m` : 'Editable schedule widget'}</span>
            <span>{error ? `Fallback • ${error}` : 'Phoenix Suns defaults included'}</span>
          </div>
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'team-schedule',
  name: 'Team Schedule',
  description: 'Show upcoming games for a team with Phoenix Suns defaults.',
  icon: 'calendarRange',
  minW: 3,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  component: TeamSchedule,
  OptionsComponent: TeamScheduleOptions,
  defaultProps: {
    title: 'Team Schedule',
    teamName: 'Phoenix Suns',
    league: 'NBA',
    source: 'demo',
    apiUrl: '',
    manualData: '',
    maxGames: 5,
    showVenue: true,
    showStatus: true,
    refreshInterval: 30,
    useCorsProxy: true,
  },
});
