import { strFromU8, unzipSync } from 'fflate';
import { buildProxyUrl } from './corsProxy';
import {
  ROUTES as BAKED_ROUTES,
  SERVICE_DATES as BAKED_SERVICE_DATES,
  STOP_INFO as BAKED_STOP_INFO,
  STOP_SCHEDULE as BAKED_STOP_SCHEDULE,
  type RouteInfo,
  type ScheduleEntry,
  type StopInfo,
} from './gtfsData';

const STATIC_GTFS_URL =
  'https://bct.tmix.se/Tmix.Cap.TdExport.WebApi/gtfs/?operatorIds=22';
const CACHE_KEY = 'campus-hub:transit:prince-george-static-gtfs:v1';
const TARGET_STOP_ID = '105017';
const TARGET_ROUTE_IDS = new Set(['15-PRG', '16-PRG', '19-PRG']);
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

export interface StaticGtfsData {
  stopInfo: StopInfo;
  routes: Record<string, RouteInfo>;
  serviceDates: Record<string, string[]>;
  stopSchedule: ScheduleEntry[];
  feedVersion?: string;
  feedStartDate?: string;
  feedEndDate?: string;
  fetchedAt?: number;
}

export type StaticGtfsSource = 'network' | 'cache' | 'baked';

export interface StaticGtfsSnapshot {
  data: StaticGtfsData;
  source: StaticGtfsSource;
}

interface StaticGtfsCacheEntry {
  data: StaticGtfsData;
  storedAt: number;
}

export const BAKED_STATIC_GTFS: StaticGtfsData = {
  stopInfo: BAKED_STOP_INFO,
  routes: BAKED_ROUTES,
  serviceDates: BAKED_SERVICE_DATES,
  stopSchedule: BAKED_STOP_SCHEDULE,
};

function readCachedStaticGtfs(): StaticGtfsCacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StaticGtfsCacheEntry;
    if (!parsed?.data?.stopSchedule || !parsed?.data?.serviceDates) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedStaticGtfs(data: StaticGtfsData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, storedAt: Date.now() } satisfies StaticGtfsCacheEntry),
    );
  } catch {
    // Ignore storage quota/private-mode failures. The baked data remains as fallback.
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function csvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? '';
    });
    return record;
  });
}

function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function parseDateStr(value: string): Date {
  return new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(4, 6)) - 1,
    Number(value.slice(6, 8)),
  );
}

function buildServiceDates(files: Record<string, string>): Record<string, string[]> {
  const serviceDates: Record<string, Set<string>> = {};

  const addDate = (serviceId: string, date: string) => {
    if (!serviceId || !date) return;
    serviceDates[serviceId] ??= new Set();
    serviceDates[serviceId].add(date);
  };

  const removeDate = (serviceId: string, date: string) => {
    serviceDates[serviceId]?.delete(date);
  };

  if (files['calendar.txt']) {
    for (const row of csvRecords(files['calendar.txt'])) {
      const start = row.start_date;
      const end = row.end_date;
      if (!row.service_id || !start || !end) continue;
      const current = parseDateStr(start);
      const last = parseDateStr(end);
      while (current <= last) {
        const weekday = current.getDay();
        const active =
          (weekday === 0 && row.sunday === '1') ||
          (weekday === 1 && row.monday === '1') ||
          (weekday === 2 && row.tuesday === '1') ||
          (weekday === 3 && row.wednesday === '1') ||
          (weekday === 4 && row.thursday === '1') ||
          (weekday === 5 && row.friday === '1') ||
          (weekday === 6 && row.saturday === '1');
        if (active) addDate(row.service_id, dateToStr(current));
        current.setDate(current.getDate() + 1);
      }
    }
  }

  if (files['calendar_dates.txt']) {
    for (const row of csvRecords(files['calendar_dates.txt'])) {
      if (row.exception_type === '1') addDate(row.service_id, row.date);
      if (row.exception_type === '2') removeDate(row.service_id, row.date);
    }
  }

  return Object.fromEntries(
    Object.entries(serviceDates).map(([serviceId, dates]) => [
      serviceId,
      [...dates].sort(),
    ]),
  );
}

export function parseStaticGtfsFiles(files: Record<string, string>): StaticGtfsData {
  const stop = csvRecords(files['stops.txt'] ?? '').find(
    (row) => row.stop_id === TARGET_STOP_ID || row.stop_code === TARGET_STOP_ID,
  );

  const routes: Record<string, RouteInfo> = {};
  for (const row of csvRecords(files['routes.txt'] ?? '')) {
    if (!TARGET_ROUTE_IDS.has(row.route_id)) continue;
    routes[row.route_id] = {
      shortName: row.route_short_name,
      longName: row.route_long_name,
      color: row.route_color || BAKED_ROUTES[row.route_id]?.color || 'FFFFFF',
    };
  }

  const trips = new Map<string, { routeId: string; serviceId: string; headsign: string }>();
  for (const row of csvRecords(files['trips.txt'] ?? '')) {
    if (!TARGET_ROUTE_IDS.has(row.route_id)) continue;
    trips.set(row.trip_id, {
      routeId: row.route_id,
      serviceId: row.service_id,
      headsign: row.trip_headsign,
    });
  }

  const stopSchedule: ScheduleEntry[] = [];
  for (const row of csvRecords(files['stop_times.txt'] ?? '')) {
    if (row.stop_id !== TARGET_STOP_ID) continue;
    const trip = trips.get(row.trip_id);
    if (!trip) continue;
    stopSchedule.push({
      tripId: row.trip_id,
      routeId: trip.routeId,
      headsign: row.stop_headsign || trip.headsign,
      serviceId: trip.serviceId,
      arrivalTime: row.arrival_time,
      departureTime: row.departure_time,
    });
  }

  const feedInfo = csvRecords(files['feed_info.txt'] ?? '')[0] ?? {};

  return {
    stopInfo: stop
      ? {
          stopId: stop.stop_id,
          stopName: stop.stop_name,
          lat: Number(stop.stop_lat),
          lon: Number(stop.stop_lon),
        }
      : BAKED_STOP_INFO,
    routes: Object.keys(routes).length > 0 ? routes : BAKED_ROUTES,
    serviceDates: buildServiceDates(files),
    stopSchedule,
    feedVersion: feedInfo.feed_version,
    feedStartDate: feedInfo.feed_start_date,
    feedEndDate: feedInfo.feed_end_date,
    fetchedAt: Date.now(),
  };
}

export function parseStaticGtfsZip(zipBytes: Uint8Array): StaticGtfsData {
  const unzipped = unzipSync(zipBytes);
  const files: Record<string, string> = {};
  for (const [path, bytes] of Object.entries(unzipped)) {
    const fileName = path.split('/').pop();
    if (!fileName) continue;
    files[fileName] = strFromU8(bytes);
  }

  return parseStaticGtfsFiles(files);
}

function isUsableStaticGtfs(data: StaticGtfsData): boolean {
  return data.stopSchedule.length > 0 && Object.keys(data.serviceDates).length > 0;
}

export function getCachedStaticGtfs(): StaticGtfsData | null {
  const cached = readCachedStaticGtfs();
  if (!cached) return null;
  if (Date.now() - cached.storedAt > CACHE_MAX_AGE_MS) return null;
  return cached.data;
}

export async function fetchStaticGtfs(useCorsProxy: boolean): Promise<StaticGtfsData> {
  const url = useCorsProxy ? buildProxyUrl(STATIC_GTFS_URL) : STATIC_GTFS_URL;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch static GTFS: ${response.status}`);

  const data = parseStaticGtfsZip(new Uint8Array(await response.arrayBuffer()));
  if (!isUsableStaticGtfs(data)) {
    throw new Error('Fetched static GTFS did not contain usable UNBC schedule data');
  }

  writeCachedStaticGtfs(data);
  return data;
}

export async function getBestStaticGtfsSnapshot(useCorsProxy: boolean): Promise<StaticGtfsSnapshot> {
  const cached = getCachedStaticGtfs();
  try {
    return { data: await fetchStaticGtfs(useCorsProxy), source: 'network' };
  } catch (err) {
    if (cached) return { data: cached, source: 'cache' };
    console.warn('Failed to fetch static GTFS, using baked schedule snapshot:', err);
    return { data: BAKED_STATIC_GTFS, source: 'baked' };
  }
}

export async function getBestStaticGtfs(useCorsProxy: boolean): Promise<StaticGtfsData> {
  return (await getBestStaticGtfsSnapshot(useCorsProxy)).data;
}
