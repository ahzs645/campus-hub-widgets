'use client';
import { useState } from 'react';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

export default function HomeAssistantOptions({ data, onChange }: WidgetOptionsProps) {
  const mode = (data.mode as 'signaling' | 'http') === 'http' ? 'http' : 'signaling';
  const signalUrl = (data.signalUrl as string) || '';
  const displayId = (data.displayId as string) || '';
  const httpUrl = (data.httpUrl as string) || '';
  const pollIntervalSeconds = Number(data.pollIntervalSeconds as number) || 30;
  const entityIds = (data.entityIds as string[]) || [];
  const [newEntityId, setNewEntityId] = useState('');

  const update = (patch: Record<string, unknown>) => {
    onChange({ ...data, ...patch });
  };

  const addEntity = () => {
    const id = newEntityId.trim();
    if (id && !entityIds.includes(id)) {
      update({ entityIds: [...entityIds, id] });
      setNewEntityId('');
    }
  };

  const removeEntity = (id: string) => {
    update({ entityIds: entityIds.filter((e) => e !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Connection Mode</label>
        <select
          value={mode}
          onChange={(e) => update({ mode: e.target.value })}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/30"
        >
          <option value="signaling">Live signaling bridge</option>
          <option value="http">HTTP proxy</option>
        </select>
        <p className="text-[10px] text-white/30">
          Use signaling for the existing Socket.IO bridge, or HTTP when your app proxies the Campus Hub Home Assistant plugin.
        </p>
      </div>

      {mode === 'signaling' ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Home Assistant Bridge URL</label>
            <input
              type="url"
              value={signalUrl}
              onChange={(e) => update({ signalUrl: e.target.value })}
              placeholder="ws://localhost:3030"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30"
            />
            <p className="text-[10px] text-white/30">Point this at the Socket.IO bridge that relays Home Assistant entity updates.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Display ID</label>
            <input
              type="text"
              value={displayId}
              onChange={(e) => update({ displayId: e.target.value })}
              placeholder="lobby-tv-1"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30"
            />
            <p className="text-[10px] text-white/30">Leave empty to use the display&apos;s ?displayId= URL param</p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">HTTP Proxy URL</label>
            <input
              type="url"
              value={httpUrl}
              onChange={(e) => update({ httpUrl: e.target.value })}
              placeholder="http://localhost:3030/ha/state"
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30"
            />
            <p className="text-[10px] text-white/30">
              Leave empty to use `/api/ha/state` on the current Campus Hub origin.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Poll Interval (seconds)</label>
            <input
              type="number"
              min={5}
              max={3600}
              value={pollIntervalSeconds}
              onChange={(e) => update({ pollIntervalSeconds: Number(e.target.value) || 30 })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30"
            />
            <p className="text-[10px] text-white/30">HTTP mode polls the proxy on this interval.</p>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/60">Entity IDs</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEntityId}
            onChange={(e) => setNewEntityId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntity()}
            placeholder="sensor.temperature, camera.front_door"
            className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 font-mono"
          />
          <button
            onClick={addEntity}
            className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/15"
          >
            Add
          </button>
        </div>
        {entityIds.length > 0 && (
          <div className="space-y-1 mt-2">
            {entityIds.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
              >
                <span className="text-xs font-mono text-white/60">{id}</span>
                <button
                  onClick={() => removeEntity(id)}
                  className="text-xs text-red-400/60 hover:text-red-400"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-white/30">
          Examples: sensor.room_temperature, sensor.bambu_lab_print_progress, media_player.living_room, camera.front_door
        </p>
      </div>
    </div>
  );
}
