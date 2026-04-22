import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  buildProxyUrl,
  getCorsProxyUrl,
} from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';
import { ROOM_MAP, resolveRoomInfo, sortRooms, type RoomInfo } from './libraryAvailabilityRooms';

type DisplayMode = 'grid' | 'calendar' | 'cards';
type RoomScope = 'all' | 'single';

interface LibCalSlot {
  itemId?: number | string;
}

interface LibCalGridResponse {
  slots?: LibCalSlot[];
}

interface LibraryAvailabilityData {
  title: string;
  mode: DisplayMode;
  roomScope: RoomScope;
  selectedRoomId: string;
  endpoint: string;
  lid: number;
  gid: number;
  pageSize: number;
  daysToShow: number;
  rotationSeconds: number;
  refreshSeconds: number;
  openHour: number;
  closeHour: number;
  useCorsProxy: boolean;
}

const DEFAULTS: LibraryAvailabilityData = {
  title: 'Library Study Room Availability',
  mode: 'grid',
  roomScope: 'all',
  selectedRoomId: '',
  endpoint: '',
  lid: 1637,
  gid: 2928,
  pageSize: 99,
  daysToShow: 3,
  rotationSeconds: 8,
  refreshSeconds: 120,
  openHour: 8,
  closeHour: 23,
  useCorsProxy: true,
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date => {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
};

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const extractRoomsFromResponse = (response: LibCalGridResponse): RoomInfo[] => {
  const roomById = new Map<number, RoomInfo>();
  const slots = Array.isArray(response.slots) ? response.slots : [];

  slots.forEach((slot) => {
    const roomId = Number(slot.itemId);
    if (!Number.isFinite(roomId) || roomById.has(roomId)) return;
    roomById.set(roomId, resolveRoomInfo(roomId));
  });

  return sortRooms(Array.from(roomById.values()));
};

export default function LibraryAvailabilityOptions({ data, onChange }: WidgetOptionsProps) {
  const state: LibraryAvailabilityData = {
    title: (data?.title as string) ?? DEFAULTS.title,
    mode: (data?.mode as DisplayMode) ?? DEFAULTS.mode,
    roomScope: data?.roomScope === 'single' ? 'single' : DEFAULTS.roomScope,
    selectedRoomId: String((data?.selectedRoomId as string | number | undefined) ?? DEFAULTS.selectedRoomId),
    endpoint: (data?.endpoint as string) ?? DEFAULTS.endpoint,
    lid: (data?.lid as number) ?? DEFAULTS.lid,
    gid: (data?.gid as number) ?? DEFAULTS.gid,
    pageSize: (data?.pageSize as number) ?? DEFAULTS.pageSize,
    daysToShow: (data?.daysToShow as number) ?? DEFAULTS.daysToShow,
    rotationSeconds: (data?.rotationSeconds as number) ?? DEFAULTS.rotationSeconds,
    refreshSeconds: (data?.refreshSeconds as number) ?? DEFAULTS.refreshSeconds,
    openHour: (data?.openHour as number) ?? DEFAULTS.openHour,
    closeHour: (data?.closeHour as number) ?? DEFAULTS.closeHour,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? DEFAULTS.useCorsProxy,
  };

  const [liveRooms, setLiveRooms] = useState<RoomInfo[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState('');
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const endpoint = state.endpoint.trim();
    const proxyMissing = state.useCorsProxy && !getCorsProxyUrl();

    if (!endpoint || proxyMissing) {
      fetchControllerRef.current?.abort();
      setLiveRooms([]);
      setRoomLoading(false);
      setRoomError(proxyMissing && endpoint ? 'A CORS proxy is needed to load room choices from LibCal.' : '');
      return;
    }

    const timeout = setTimeout(() => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      const firstDay = startOfDay(new Date());
      const daysToQuery = clamp(Math.round(state.daysToShow || DEFAULTS.daysToShow), 1, 22);
      const start = formatDateKey(firstDay);
      const end = formatDateKey(addDays(firstDay, daysToQuery));
      const targetUrl = state.useCorsProxy ? buildProxyUrl(endpoint) : endpoint;

      const formData = new FormData();
      formData.set('lid', String(state.lid || DEFAULTS.lid));
      formData.set('gid', String(state.gid || DEFAULTS.gid));
      formData.set('start', start);
      formData.set('end', end);
      formData.set('pageSize', String(clamp(Math.round(state.pageSize || DEFAULTS.pageSize), 1, 500)));

      setRoomLoading(true);
      setRoomError('');

      fetch(targetUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<LibCalGridResponse>;
        })
        .then((json) => {
          const rooms = extractRoomsFromResponse(json);
          setLiveRooms(rooms);
          if (rooms.length === 0) {
            setRoomError('No rooms were returned by the LibCal query.');
          }
        })
        .catch((err: unknown) => {
          if ((err as { name?: string }).name === 'AbortError') return;
          setLiveRooms([]);
          setRoomError('Could not load room choices from LibCal.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setRoomLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(timeout);
      fetchControllerRef.current?.abort();
    };
  }, [
    state.daysToShow,
    state.endpoint,
    state.gid,
    state.lid,
    state.pageSize,
    state.useCorsProxy,
  ]);

  const availableRooms = liveRooms.length > 0 ? liveRooms : ROOM_MAP;

  const roomOptions = useMemo(() => {
    const options = availableRooms.map((room) => ({
      value: String(room.id),
      label: room.capacity ? `${room.name} (${room.capacity} seats)` : room.name,
    }));

    if (state.selectedRoomId && !options.some((option) => option.value === state.selectedRoomId)) {
      options.push({ value: state.selectedRoomId, label: `Room ${state.selectedRoomId} (current)` });
    }

    return [
      {
        value: '',
        label: options[0] ? `Auto (${options[0].label})` : 'Auto (first room)',
      },
      ...options,
    ];
  }, [availableRooms, state.selectedRoomId]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Display</h3>

        <FormInput
          label="Widget Title"
          name="title"
          type="text"
          value={state.title}
          onChange={handleChange}
        />

        <FormSelect
          label="Mode"
          name="mode"
          value={state.mode}
          options={[
            { value: 'grid', label: 'Time Grid (room x half-hour)' },
            { value: 'calendar', label: 'Calendar Summary (room x day)' },
            { value: 'cards', label: 'Room Cards' },
          ]}
          onChange={handleChange}
        />

        <FormSelect
          label="Rooms to Show"
          name="roomScope"
          value={state.roomScope}
          options={[
            { value: 'all', label: 'All rooms' },
            { value: 'single', label: 'Single room' },
          ]}
          onChange={handleChange}
        />

        {state.roomScope === 'single' && (
          <>
            <FormSelect
              label="Room"
              name="selectedRoomId"
              value={state.selectedRoomId}
              options={roomOptions}
              onChange={handleChange}
            />

            <div className="text-xs text-[var(--ui-text-muted)]">
              {roomLoading
                ? 'Loading rooms from LibCal...'
                : roomError
                  ? roomError
                  : liveRooms.length > 0
                    ? `${liveRooms.length} rooms loaded from the LibCal query.`
                    : 'Using demo room choices until live LibCal data is connected.'}
            </div>
          </>
        )}

        <FormInput
          label="Days to Fetch"
          name="daysToShow"
          type="number"
          value={state.daysToShow}
          min={1}
          max={22}
          onChange={handleChange}
        />

        <FormInput
          label="Page Rotation (seconds)"
          name="rotationSeconds"
          type="number"
          value={state.rotationSeconds}
          min={2}
          max={120}
          onChange={handleChange}
        />

        <FormInput
          label="Refresh Interval (seconds)"
          name="refreshSeconds"
          type="number"
          value={state.refreshSeconds}
          min={30}
          max={3600}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Library Hours</h3>

        <FormInput
          label="Open Hour (24h)"
          name="openHour"
          type="number"
          value={state.openHour}
          min={0}
          max={23}
          onChange={handleChange}
        />

        <FormInput
          label="Close Hour (24h)"
          name="closeHour"
          type="number"
          value={state.closeHour}
          min={1}
          max={24}
          onChange={handleChange}
        />

        <div className="text-xs text-[var(--ui-text-muted)]">
          The default campus setup is 08:00 to 23:00 with 30-minute slots.
        </div>
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">LibCal Endpoint</h3>

        <FormInput
          label="Endpoint URL"
          name="endpoint"
          type="url"
          value={state.endpoint}
          placeholder="https://unbc.libcal.com/spaces/availability/grid"
          onChange={handleChange}
        />

        <FormInput
          label="Library ID (lid)"
          name="lid"
          type="number"
          value={state.lid}
          min={1}
          onChange={handleChange}
        />

        <FormInput
          label="Group ID (gid)"
          name="gid"
          type="number"
          value={state.gid}
          min={1}
          onChange={handleChange}
        />

        <FormInput
          label="pageSize"
          name="pageSize"
          type="number"
          value={state.pageSize}
          min={1}
          max={500}
          onChange={handleChange}
        />

        <div className="text-xs text-[var(--ui-text-muted)] space-y-1">
          <p>Requires POST form fields: lid, gid, start, end, pageSize.</p>
        </div>
      </div>

      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Network</h3>

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
