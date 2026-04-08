'use client';
import { useEffect, useState } from 'react';
import {
  FormInput,
  FormSelect,
  FormSwitch,
  OptionsPanel,
  OptionsSection,
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

export default function TeamScheduleOptions({ data, onChange }: WidgetOptionsProps) {
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
    onChange(next as unknown as Record<string, unknown>);
  };

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

          {state.source === 'manual' && (
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

          {state.source === 'url' && (
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
