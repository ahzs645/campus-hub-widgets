'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface ClimbingGymData {
  gymName: string;
  portalUrl: string;
  refreshInterval: number;
  showCapacityBar: boolean;
  showHours: boolean;
  useCorsProxy: boolean;
}

const DEFAULT_PORTAL_URL =
  'https://portal.rockgympro.com/portal/public/e4f8e07377b8d1ba053944154f4c2c50/occupancy?&iframeid=occupancyCounter&fId=';

export default function ClimbingGymOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<ClimbingGymData>({
    gymName: (data?.gymName as string) ?? 'OVERhang',
    portalUrl: (data?.portalUrl as string) ?? '',
    refreshInterval: (data?.refreshInterval as number) ?? 5,
    showCapacityBar: (data?.showCapacityBar as boolean) ?? true,
    showHours: (data?.showHours as boolean) ?? true,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? true,
  });

  useEffect(() => {
    if (data) {
      setState({
        gymName: (data.gymName as string) ?? 'OVERhang',
        portalUrl: (data.portalUrl as string) ?? '',
        refreshInterval: (data.refreshInterval as number) ?? 5,
        showCapacityBar: (data.showCapacityBar as boolean) ?? true,
        showHours: (data.showHours as boolean) ?? true,
        useCorsProxy: (data.useCorsProxy as boolean) ?? true,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange({ ...data, ...newState });
  };

  return (
    <div className="space-y-6">
      {/* Gym Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Gym Settings</h3>

        <FormInput
          label="Gym Name"
          name="gymName"
          type="text"
          value={state.gymName}
          placeholder="OVERhang"
          onChange={handleChange}
        />

        <FormInput
          label="Rock Gym Pro Portal URL"
          name="portalUrl"
          type="text"
          value={state.portalUrl}
          placeholder={DEFAULT_PORTAL_URL}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          The public occupancy iframe URL from Rock Gym Pro. Default is set to OVERhang Climbing Gym.
        </div>
      </div>

      {/* Display */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Display</h3>

        <FormSwitch
          label="Show Capacity Bar"
          name="showCapacityBar"
          checked={state.showCapacityBar}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Hours & Open/Closed Status"
          name="showHours"
          checked={state.showHours}
          onChange={handleChange}
        />
      </div>

      {/* Refresh Interval */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Refresh Interval</h3>

        <FormSelect
          label="Auto-refresh every"
          name="refreshInterval"
          value={String(state.refreshInterval)}
          options={[
            { value: '1', label: '1 minute' },
            { value: '2', label: '2 minutes' },
            { value: '5', label: '5 minutes' },
            { value: '10', label: '10 minutes' },
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
          ]}
          onChange={(name, value) => handleChange(name, Number(value))}
        />
      </div>

      {/* CORS Proxy */}
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
