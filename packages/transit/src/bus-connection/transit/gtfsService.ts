/**
 * GTFS Service for Prince George Transit - UNBC Exchange
 *
 * Combines static schedule data with optional GTFS-realtime trip updates.
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { buildProxyUrl } from './corsProxy';
import { BAKED_STATIC_GTFS, getBestStaticGtfsSnapshot, type StaticGtfsData } from './staticGtfs';

const POLL_INTERVAL = 30000;
const STATIC_REFRESH_INTERVAL = 1000 * 60 * 60 * 6;
const STATIC_RETRY_INTERVAL = 1000 * 60 * 5;

export interface Trip {
  tripId: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  headsign: string;
  arrivalTime: number;
  departureTime: number;
  isRealtime: boolean;
}

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function getActiveServiceIds(dateStr: string, staticData: StaticGtfsData): string[] {
  const active: string[] = [];
  for (const [serviceId, dates] of Object.entries(staticData.serviceDates)) {
    if (dates.includes(dateStr)) {
      active.push(serviceId);
    }
  }
  return active;
}

function gtfsTimeToDate(timeStr: string, baseDate: Date): Date {
  const [h, m, s] = timeStr.split(':').map(Number);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  base.setSeconds(base.getSeconds() + h * 3600 + m * 60 + s);
  return base;
}

/**
 * Check if a headsign indicates the bus is heading TO UNBC.
 */
function isUNBCBound(headsign: string): boolean {
  const h = (headsign || '').toLowerCase();
  return h === 'unbc' || h === 'n unbc via cnc';
}

/**
 * Headsign overrides for loop routes where the GTFS headsign is just "UNBC".
 */
const LOOP_ROUTE_HEADSIGNS: Record<string, string> = {
  '19-PRG': 'Westgate Mall',
};

/**
 * Get scheduled trips departing from UNBC Exchange.
 *
 * - Deduplicates loop routes (same tripId at stop twice) to only show departures
 * - Filters out UNBC-bound arrivals for routes with outbound trips (15, 16)
 * - Shows departure times with combined "UNBC/{destination}" headsigns
 */
export function getScheduledTrips(
  simulatedNow: Date | null = null,
  staticData: StaticGtfsData = BAKED_STATIC_GTFS,
): Trip[] {
  const now = simulatedNow || new Date();
  const dateStr = dateToStr(now);
  const activeServiceIds = getActiveServiceIds(dateStr, staticData);
  if (activeServiceIds.length === 0) return [];

  // Collect active entries
  const activeEntries = staticData.stopSchedule.filter(entry =>
    activeServiceIds.includes(String(entry.serviceId))
  );

  // Deduplicate: loop routes visit the same stop twice per trip.
  // Keep only the earliest occurrence (the departure, not the return).
  const tripMap = new Map<string, typeof staticData.stopSchedule[0]>();
  for (const entry of activeEntries) {
    const existing = tripMap.get(entry.tripId);
    if (!existing || entry.departureTime < existing.departureTime) {
      tripMap.set(entry.tripId, entry);
    }
  }
  const dedupedEntries = [...tripMap.values()];

  // Find which routes have non-UNBC headsigns (outbound directions)
  const routesWithOutbound = new Set<string>();
  for (const entry of dedupedEntries) {
    if (!isUNBCBound(entry.headsign)) {
      routesWithOutbound.add(entry.routeId);
    }
  }

  const trips: Trip[] = [];

  for (const entry of dedupedEntries) {
    // For routes with outbound trips, skip UNBC-bound entries (those are inbound arrivals)
    if (isUNBCBound(entry.headsign) && routesWithOutbound.has(entry.routeId)) continue;

    const departureDate = gtfsTimeToDate(entry.departureTime, now);
    if (departureDate.getTime() < now.getTime() - 30000) continue;

    const route = staticData.routes[entry.routeId];
    if (!route) continue;

    // Build headsign: loop routes get override, others get "UNBC/{destination}"
    let headsign: string;
    if (isUNBCBound(entry.headsign)) {
      const override = LOOP_ROUTE_HEADSIGNS[entry.routeId];
      headsign = override ? `UNBC/${override}` : entry.headsign;
    } else {
      headsign = `UNBC/${entry.headsign}`;
    }

    trips.push({
      tripId: entry.tripId,
      routeId: entry.routeId,
      routeName: route.shortName,
      routeColor: route.color,
      headsign,
      arrivalTime: departureDate.getTime(),
      departureTime: departureDate.getTime(),
      isRealtime: false,
    });
  }

  trips.sort((a, b) => a.arrivalTime - b.arrivalTime);
  return trips;
}

interface RealtimeUpdate {
  arrivalDelay: number;
  departureDelay: number;
  arrivalTime: number | null;
  departureTime: number | null;
}

async function fetchRealtimeUpdates(
  stopId: string,
  proxyUrl?: string,
  useCorsProxy: boolean = true,
  realtimeUrl?: string,
): Promise<Map<string, RealtimeUpdate>> {
  try {
    let url: string;
    if (proxyUrl) {
      // Widget-specific proxy: treat as a base URL and append the feed path
      url = proxyUrl.endsWith('/')
        ? `${proxyUrl}tripupdates.pb?operatorIds=22`
        : `${proxyUrl}/tripupdates.pb?operatorIds=22`;
    } else if (realtimeUrl) {
      url = useCorsProxy ? buildProxyUrl(realtimeUrl) : realtimeUrl;
    } else {
      // No proxy available, cannot fetch
      return new Map();
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Realtime feed returned HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const updates = new Map<string, RealtimeUpdate>();

    for (const entity of feed.entity) {
      if (!entity.tripUpdate) continue;

      const tripId = entity.tripUpdate.trip?.tripId;
      if (!tripId) continue;

      for (const stu of entity.tripUpdate.stopTimeUpdate || []) {
        if (String(stu.stopId) === stopId) {
          const arrivalTime = stu.arrival?.time;
          const departureTime = stu.departure?.time;
          updates.set(tripId, {
            arrivalDelay: stu.arrival?.delay ?? 0,
            departureDelay: stu.departure?.delay ?? 0,
            arrivalTime: arrivalTime ? Number(arrivalTime) : null,
            departureTime: departureTime ? Number(departureTime) : null,
          });
          break;
        }
      }
    }

    return updates;
  } catch (err) {
    throw err;
  }
}

function applyRealtimeUpdates(trips: Trip[], rtUpdates: Map<string, RealtimeUpdate>): Trip[] {
  return trips.map(trip => {
    const update = rtUpdates.get(trip.tripId);
    if (!update) return trip;

    if (update.arrivalTime) {
      return {
        ...trip,
        arrivalTime: update.arrivalTime * 1000,
        departureTime: (update.departureTime || update.arrivalTime) * 1000,
        isRealtime: true,
      };
    }

    return {
      ...trip,
      arrivalTime: trip.arrivalTime + update.arrivalDelay * 1000,
      departureTime: trip.departureTime + update.departureDelay * 1000,
      isRealtime: true,
    };
  });
}

export interface LiveTripSource {
  gtfsUrl: string;
  realtimeUrl?: string;
  proxyUrl?: string;
  useCorsProxy?: boolean;
  onError?: (message: string | null) => void;
}

export function createLiveTripProvider(
  onUpdate: (trips: Trip[]) => void,
  source: LiveTripSource,
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let staticData: StaticGtfsData | null = null;
  let nextStaticRefreshAt = 0;
  let stopped = false;
  let refreshing = false;
  const useCorsProxy = source.useCorsProxy ?? true;

  async function refresh() {
    if (stopped || refreshing) return;
    refreshing = true;
    let warning: string | null = null;
    try {
      if (!source.gtfsUrl.trim()) throw new Error('Select a static GTFS source');
      if (!staticData || Date.now() >= nextStaticRefreshAt) {
        const snapshot = await getBestStaticGtfsSnapshot(useCorsProxy, source.gtfsUrl);
        staticData = snapshot.data;
        if (snapshot.source === 'cache') warning = 'Showing a cached transit schedule';
        nextStaticRefreshAt = Date.now() + (snapshot.source === 'network' ? STATIC_REFRESH_INTERVAL : STATIC_RETRY_INTERVAL);
      }
      if (stopped) return;
      const scheduled = getScheduledTrips(null, staticData);
      let trips = scheduled;
      if (source.realtimeUrl || source.proxyUrl) {
        try {
          const updates = await fetchRealtimeUpdates(staticData.stopInfo.stopId, source.proxyUrl, useCorsProxy, source.realtimeUrl);
          trips = applyRealtimeUpdates(scheduled, updates);
        } catch (error) {
          warning = error instanceof Error ? error.message : 'Realtime transit data unavailable';
        }
      }
      if (!stopped) {
        source.onError?.(warning);
        onUpdate(trips);
      }
    } catch (error) {
      if (!stopped) source.onError?.(error instanceof Error ? error.message : 'Transit source unavailable');
    } finally {
      refreshing = false;
    }
  }

  return {
    start() {
      stopped = false;
      void refresh();
      intervalId = setInterval(() => { void refresh(); }, POLL_INTERVAL);
    },
    stop() {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    },
    refresh,
  };
}
