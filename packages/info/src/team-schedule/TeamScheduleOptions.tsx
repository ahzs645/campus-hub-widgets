'use client';
import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
  describeCapabilities,
  useWidgetOptionsSurface,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface TeamScheduleOptionsState {
  title: string;
  teamName: string;
  league: string;
  source: 'demo' | 'manual' | 'url';
  apiUrl: string;
  manualData: string;
  maxGames: number;
  showVenue: boolean;
  showStatus: boolean;
  refreshInterval: number;
  useCorsProxy: boolean;
}

function normalizeState(data: Record<string, unknown> | undefined): TeamScheduleOptionsState {
  return {
    title: (data?.title as string) ?? 'Team Schedule',
    teamName: (data?.teamName as string) ?? 'Phoenix Suns',
    league: (data?.league as string) ?? 'NBA',
    source: (data?.source as TeamScheduleOptionsState['source']) ?? 'demo',
    apiUrl: (data?.apiUrl as string) ?? '',
    manualData: (data?.manualData as string) ?? '',
    maxGames: (data?.maxGames as number) ?? 5,
    showVenue: (data?.showVenue as boolean) ?? true,
    showStatus: (data?.showStatus as boolean) ?? true,
    refreshInterval: (data?.refreshInterval as number) ?? 30,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  };
}

export default function TeamScheduleOptions({ data, onChange, linkedSource }: WidgetOptionsProps) {
  const surface = useWidgetOptionsSurface();
  const [state, setState] = useState<TeamScheduleOptionsState>(normalizeState(data));

  useEffect(() => {
    setState(normalizeState(data));
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = {
      ...state,
      [name]: name === 'maxGames' || name === 'refreshInterval' ? Math.max(1, Number(value) || 1) : value,
    } as TeamScheduleOptionsState;

    setState(next);
    // Preserve fields this form doesn't own (e.g. `__sourceRef`).
    onChange({ ...data, ...next });
  };

  // Switch back to a manually-managed schedule, unlinking any library source.
  const handleUseManual = () => {
    const unlinked = { ...data };
    delete (unlinked as Record<string, unknown>).__sourceRef;
    const next = {
      ...state,
      source: (state.manualData.trim() ? 'manual' : 'demo') as TeamScheduleOptionsState['source'],
    };
    setState(next);
    onChange({ ...unlinked, ...next });
  };

  const isLinked = Boolean(linkedSource) || Boolean(data.__sourceRef);
  const linkedName = linkedSource?.name ?? 'Library source';
  const linkedUrl = linkedSource?.url ?? (state.apiUrl || undefined);
  const capabilityChips = linkedSource?.capabilities ? describeCapabilities(linkedSource.capabilities) : [];

  return (
    <OptionsPanel>
      <OptionsSection title="Team">
        <FormInput
          label="Widget Title"
          name="title"
          value={state.title}
          placeholder="Team Schedule"
          onChange={handleChange}
        />

        <FormInput
          label="Team Name"
          name="teamName"
          value={state.teamName}
          placeholder="Phoenix Suns"
          onChange={handleChange}
        />

        <FormInput
          label="League"
          name="league"
          value={state.league}
          placeholder="NBA"
          onChange={handleChange}
        />
      </OptionsSection>

      {surface !== 'gallery' && (
        <OptionsSection title="Data Source" divider>
          {isLinked ? (
            <div className="rounded-lg border border-[color:var(--ui-accent-soft)] bg-[var(--ui-accent-soft)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">Linked source</div>
                  <div className="mt-0.5 text-sm font-medium truncate text-[var(--ui-text)]">
                    {linkedName}
                  </div>
                  {linkedUrl && (
                    <div className="text-xs truncate text-[var(--ui-text-muted)]">{linkedUrl}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUseManual}
                  className="flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-[var(--ui-text-muted)] hover:bg-[var(--ui-item-hover)] hover:text-[var(--ui-text)] transition-colors"
                >
                  Use manual schedule
                </button>
              </div>
              {capabilityChips.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {capabilityChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[color:var(--ui-item-border)] bg-[var(--ui-item-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <FormSelect
              label="Source"
              name="source"
              value={state.source}
              options={[
                { value: 'demo', label: 'Phoenix Suns demo schedule' },
                { value: 'manual', label: 'Manual CSV' },
                { value: 'url', label: 'JSON URL' },
              ]}
              onChange={handleChange}
            />
          )}

          {!isLinked && state.source === 'manual' && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Games (CSV format)</label>
                <textarea
                  rows={8}
                  value={state.manualData}
                  onChange={(event) => handleChange('manualData', event.target.value)}
                  placeholder={'date,opponent,home,time,venue,status,note\n2026-10-21,Los Angeles Lakers,true,7:00 PM,Footprint Center,Next Up,Opening night\n2026-10-23,Golden State Warriors,false,7:30 PM,Chase Center,Scheduled,Road swing'}
                  className="w-full rounded-lg bg-[var(--ui-input-bg)] px-3 py-2 font-mono text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] outline-none transition-colors"
                  style={{ border: '1px solid var(--ui-input-border)' }}
                />
              </div>
              <div className="text-sm text-[var(--ui-text-muted)]">
                Columns: date, opponent, home, time, venue, status, note. Use true/false or vs/@ for the home column.
              </div>
            </>
          )}

          {!isLinked && state.source === 'url' && (
            <>
              <FormInput
                label="JSON URL"
                name="apiUrl"
                value={state.apiUrl}
                placeholder="https://example.com/games.json"
                onChange={handleChange}
              />
              <div className="text-sm text-[var(--ui-text-muted)]">
                Expected format: an array of game objects or an object with a games array. Each game should include date, opponent, and home.
              </div>
            </>
          )}
        </OptionsSection>
      )}

      <OptionsSection title="Display" divider>
        <FormInput
          label="Max Games"
          name="maxGames"
          type="number"
          value={state.maxGames}
          min={1}
          max={8}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Venue"
          name="showVenue"
          checked={state.showVenue}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Status"
          name="showStatus"
          checked={state.showStatus}
          onChange={handleChange}
        />
      </OptionsSection>

      {surface !== 'gallery' && state.source === 'url' && (
        <OptionsSection title="Refresh" divider>
          <FormInput
            label="Refresh Interval (minutes)"
            name="refreshInterval"
            type="number"
            value={state.refreshInterval}
            min={1}
            max={240}
            onChange={handleChange}
          />

          <FormSwitch
            label="Use CORS Proxy"
            name="useCorsProxy"
            checked={state.useCorsProxy}
            onChange={handleChange}
          />
        </OptionsSection>
      )}
    </OptionsPanel>
  );
}
