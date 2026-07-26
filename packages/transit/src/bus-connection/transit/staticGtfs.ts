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

/**
 * Streaming CSV row reader.
 *
 * Rows are handed to `onRow` one at a time and the array is reused, so nothing
 * is retained unless the caller copies it. Fields are produced by slicing the
 * source string between delimiters; the per-character accumulator is only
 * engaged for the rare quoted field.
 */
function streamCsvRows(text: string, onRow: (row: string[]) => void): void {
  const normalized = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const length = normalized.length;

  const row: string[] = [];
  let fieldStart = 0;
  let assembled = '';
  let hasAssembled = false;
  let inQuotes = false;
  let sawContent = false;

  const endField = (end: number) => {
    const value = hasAssembled
      ? assembled + normalized.slice(fieldStart, end)
      : normalized.slice(fieldStart, end);
    row.push(value);
    if (value.length > 0) sawContent = true;
    assembled = '';
    hasAssembled = false;
  };

  const endRow = () => {
    if (sawContent) onRow(row);
    row.length = 0;
    sawContent = false;
  };

  for (let i = 0; i < length; i += 1) {
    const char = normalized[i];

    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        // Escaped quote: fold the pending slice plus one literal quote into the
        // accumulator, then resume slicing after it.
        assembled += `${normalized.slice(fieldStart, i)}"`;
        hasAssembled = true;
        i += 1;
        fieldStart = i + 1;
        continue;
      }
      // Quote boundary \u2014 the quote itself is not part of the value.
      assembled += normalized.slice(fieldStart, i);
      hasAssembled = true;
      inQuotes = !inQuotes;
      fieldStart = i + 1;
      continue;
    }

    if (inQuotes) continue;

    if (char === ',') {
      endField(i);
      fieldStart = i + 1;
      continue;
    }

    if (char === '\n' || char === '\r') {
      endField(i);
      if (char === '\r' && normalized[i + 1] === '\n') i += 1;
      fieldStart = i + 1;
      endRow();
    }
  }

  endField(length);
  endRow();
}

/**
 * Cursor over a CSV row, addressed by header name.
 *
 * `get` reads a column without allocating anything, so a caller can reject a
 * row on one field before paying for a keyed record. This matters for
 * `stop_times.txt`, which carries every stop of every trip in the agency \u2014
 * millions of rows, of which this widget keeps the few dozen at one stop.
 */
interface CsvRowCursor {
  get(column: string): string;
  toRecord(): Record<string, string>;
}

function streamCsvRecords(text: string, visit: (row: CsvRowCursor) => void): void {
  let headers: string[] | null = null;
  const columnIndex = new Map<string, number>();
  let current: string[] = [];

  // A single cursor is reused for every row \u2014 see `visit` contract below.
  const cursor: CsvRowCursor = {
    get(column) {
      const at = columnIndex.get(column);
      return at === undefined ? '' : current[at] ?? '';
    },
    toRecord() {
      const record: Record<string, string> = {};
      headers?.forEach((header, index) => {
        record[header] = current[index] ?? '';
      });
      return record;
    },
  };

  streamCsvRows(text, (row) => {
    if (!headers) {
      headers = [...row];
      headers.forEach((header, index) => columnIndex.set(header, index));
      return;
    }
    // Valid only for the duration of the call: both `row` and `cursor` are
    // reused on the next line, so callers must copy anything they keep.
    current = row;
    visit(cursor);
  });
}

function csvRecords(text: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  streamCsvRecords(text, (row) => {
    records.push(row.toRecord());
  });
  return records;
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

  const WEEKDAY_COLUMNS = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ] as const;

  if (files['calendar.txt']) {
    streamCsvRecords(files['calendar.txt'], (row) => {
      const serviceId = row.get('service_id');
      const start = row.get('start_date');
      const end = row.get('end_date');
      if (!serviceId || !start || !end) return;
      const current = parseDateStr(start);
      const last = parseDateStr(end);
      // Read the seven day flags once rather than per day in the range.
      const active = WEEKDAY_COLUMNS.map((column) => row.get(column) === '1');
      while (current <= last) {
        if (active[current.getDay()]) addDate(serviceId, dateToStr(current));
        current.setDate(current.getDate() + 1);
      }
    });
  }

  if (files['calendar_dates.txt']) {
    streamCsvRecords(files['calendar_dates.txt'], (row) => {
      const exceptionType = row.get('exception_type');
      if (exceptionType === '1') addDate(row.get('service_id'), row.get('date'));
      if (exceptionType === '2') removeDate(row.get('service_id'), row.get('date'));
    });
  }

  return Object.fromEntries(
    Object.entries(serviceDates).map(([serviceId, dates]) => [
      serviceId,
      [...dates].sort(),
    ]),
  );
}

export function parseStaticGtfsFiles(files: Record<string, string>): StaticGtfsData {
  let stop: Record<string, string> | undefined;
  streamCsvRecords(files['stops.txt'] ?? '', (row) => {
    if (stop) return;
    if (row.get('stop_id') === TARGET_STOP_ID || row.get('stop_code') === TARGET_STOP_ID) {
      stop = row.toRecord();
    }
  });

  const routes: Record<string, RouteInfo> = {};
  streamCsvRecords(files['routes.txt'] ?? '', (row) => {
    const routeId = row.get('route_id');
    if (!TARGET_ROUTE_IDS.has(routeId)) return;
    routes[routeId] = {
      shortName: row.get('route_short_name'),
      longName: row.get('route_long_name'),
      color: row.get('route_color') || BAKED_ROUTES[routeId]?.color || 'FFFFFF',
    };
  });

  const trips = new Map<string, { routeId: string; serviceId: string; headsign: string }>();
  streamCsvRecords(files['trips.txt'] ?? '', (row) => {
    const routeId = row.get('route_id');
    if (!TARGET_ROUTE_IDS.has(routeId)) return;
    trips.set(row.get('trip_id'), {
      routeId,
      serviceId: row.get('service_id'),
      headsign: row.get('trip_headsign'),
    });
  });

  // stop_times.txt is the whole agency's timetable — the stop_id check runs
  // before anything is allocated for the row so the ~99.99% that miss cost
  // only a map lookup.
  const stopSchedule: ScheduleEntry[] = [];
  streamCsvRecords(files['stop_times.txt'] ?? '', (row) => {
    if (row.get('stop_id') !== TARGET_STOP_ID) return;
    const tripId = row.get('trip_id');
    const trip = trips.get(tripId);
    if (!trip) return;
    stopSchedule.push({
      tripId,
      routeId: trip.routeId,
      headsign: row.get('stop_headsign') || trip.headsign,
      serviceId: trip.serviceId,
      arrivalTime: row.get('arrival_time'),
      departureTime: row.get('departure_time'),
    });
  });

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
