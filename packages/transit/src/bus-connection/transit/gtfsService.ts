/**
 * GTFS Service for Prince George Transit - UNBC Exchange
 *
 * Combines static schedule data with optional GTFS-realtime trip updates.
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { buildProxyUrl, getCorsProxyUrl } from './corsProxy';
import { BAKED_STATIC_GTFS, getBestStaticGtfsSnapshot, type StaticGtfsData } from './staticGtfs';

const POLL_INTERVAL = 30000;
const STATIC_REFRESH_INTERVAL = 1000 * 60 * 60 * 6;
const STATIC_RETRY_INTERVAL = 1000 * 60 * 5;

/** Default BC Transit GTFS-Realtime trip updates endpoint (Prince George, operator 22). */
const GTFS_RT_TRIP_UPDATES_URL =
  'https://bct.tmix.se/gtfs-realtime/tripupdates.pb?operatorIds=22';

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
): Promise<Map<string, RealtimeUpdate>> {
  try {
    let url: string;
    if (proxyUrl) {
      // Widget-specific proxy: treat as a base URL and append the feed path
      url = proxyUrl.endsWith('/')
        ? `${proxyUrl}tripupdates.pb?operatorIds=22`
        : `${proxyUrl}/tripupdates.pb?operatorIds=22`;
    } else if (useCorsProxy) {
      // Use the default BC Transit feed URL, wrapped with the system CORS proxy
      url = buildProxyUrl(GTFS_RT_TRIP_UPDATES_URL);
    } else {
      // No proxy available, cannot fetch
      return new Map();
    }

    const res = await fetch(url);
    if (!res.ok) return new Map();

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
    console.warn('Failed to fetch realtime updates:', err);
    return new Map();
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

export function createLiveTripProvider(
  onUpdate: (trips: Trip[]) => void,
  proxyUrl?: string,
  getSimulatedNow?: () => Date | null,
  useCorsProxy: boolean = true,
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let rtUpdates = new Map<string, RealtimeUpdate>();
  let staticData = BAKED_STATIC_GTFS;
  let nextStaticRefreshAt = 0;
  const canFetchRealtime = !!(proxyUrl || (useCorsProxy && getCorsProxyUrl()));

  async function refresh() {
    const simNow = getSimulatedNow ? getSimulatedNow() : null;
    if (!simNow && Date.now() >= nextStaticRefreshAt) {
      const snapshot = await getBestStaticGtfsSnapshot(useCorsProxy);
      staticData = snapshot.data;
      nextStaticRefreshAt = Date.now() + (snapshot.source === 'network' ? STATIC_REFRESH_INTERVAL : STATIC_RETRY_INTERVAL);
    }
    // Only fetch realtime if not simulating and a proxy is available
    if (!simNow && canFetchRealtime) {
      rtUpdates = await fetchRealtimeUpdates(staticData.stopInfo.stopId, proxyUrl, useCorsProxy);
    }
    const scheduled = getScheduledTrips(simNow, simNow ? BAKED_STATIC_GTFS : staticData);
    const merged = simNow ? scheduled : (canFetchRealtime ? applyRealtimeUpdates(scheduled, rtUpdates) : scheduled);
    onUpdate(merged);
  }

  return {
    start() {
      refresh();
      intervalId = setInterval(refresh, POLL_INTERVAL);
    },
    stop() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    },
    refresh,
  };
}
