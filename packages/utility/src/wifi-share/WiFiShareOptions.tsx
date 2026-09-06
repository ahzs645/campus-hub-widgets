'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface WiFiShareData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
  message: string;
  showNetworkName: boolean;
  showPassword: boolean;
  bgColor: string;
  textColor: string;
  qrFgColor: string;
  qrBgColor: string;
}

function resolveColor(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export default function WiFiShareOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<WiFiShareData>({
    ssid: (data?.ssid as string) ?? '',
    password: (data?.password as string) ?? '',
    encryption: (data?.encryption as 'WPA' | 'WEP' | 'nopass') ?? 'WPA',
    hidden: (data?.hidden as boolean) ?? false,
    message: (data?.message as string) ?? 'Scan to Connect to WiFi!',
    showNetworkName: (data?.showNetworkName as boolean) ?? true,
    showPassword: (data?.showPassword as boolean) ?? true,
    bgColor: (data?.bgColor as string) ?? '',
    textColor: (data?.textColor as string) ?? '',
    qrFgColor: (data?.qrFgColor as string) ?? '',
    qrBgColor: (data?.qrBgColor as string) ?? '',
  });

  const resolvedBgColor = resolveColor(state.bgColor, '#2563eb');
  const resolvedTextColor = resolveColor(state.textColor, '#ffffff');
  const resolvedQrFgColor = resolveColor(state.qrFgColor, '#000000');
  const resolvedQrBgColor = resolveColor(state.qrBgColor, '#ffffff');

  useEffect(() => {
    if (data) {
      setState({
        ssid: (data.ssid as string) ?? '',
        password: (data.password as string) ?? '',
        encryption: (data.encryption as 'WPA' | 'WEP' | 'nopass') ?? 'WPA',
        hidden: (data.hidden as boolean) ?? false,
        message: (data.message as string) ?? 'Scan to Connect to WiFi!',
        showNetworkName: (data.showNetworkName as boolean) ?? true,
        showPassword: (data.showPassword as boolean) ?? true,
        bgColor: (data.bgColor as string) ?? '',
        textColor: (data.textColor as string) ?? '',
        qrFgColor: (data.qrFgColor as string) ?? '',
        qrBgColor: (data.qrBgColor as string) ?? '',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <div className="space-y-6">
      {/* Network Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Network Settings</h3>

        <FormInput
          label="Network Name (SSID)"
          name="ssid"
          type="text"
          value={state.ssid}
          placeholder="My WiFi Network"
          onChange={handleChange}
        />

        <FormInput
          label="Password"
          name="password"
          type="text"
          value={state.password}
          placeholder="Enter WiFi password"
          onChange={handleChange}
        />

        <FormSelect
          label="Encryption"
          name="encryption"
          value={state.encryption}
          options={[
            { value: 'WPA', label: 'WPA/WPA2/WPA3' },
            { value: 'WEP', label: 'WEP' },
            { value: 'nopass', label: 'None (Open)' },
          ]}
          onChange={handleChange}
        />

        <FormSwitch
          label="Hidden Network"
          name="hidden"
          checked={state.hidden}
          onChange={handleChange}
        />
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Display Settings</h3>

        <FormInput
          label="Message"
          name="message"
          type="text"
          value={state.message}
          placeholder="Scan to Connect to WiFi!"
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Network Name"
          name="showNetworkName"
          checked={state.showNetworkName}
          onChange={handleChange}
        />

        <FormSwitch
          label="Show Password"
          name="showPassword"
          checked={state.showPassword}
          onChange={handleChange}
        />
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Colors</h3>
        <p className="text-xs text-[var(--ui-text-muted)]">
          Leave a color unset to inherit the active theme preset in the live widget.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedBgColor}
                onChange={(e) => handleChange('bgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.bgColor || 'Theme background'}</span>
              <button
                type="button"
                onClick={() => handleChange('bgColor', '')}
                disabled={!state.bgColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedTextColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.textColor || 'Theme accent'}</span>
              <button
                type="button"
                onClick={() => handleChange('textColor', '')}
                disabled={!state.textColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">QR Foreground</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedQrFgColor}
                onChange={(e) => handleChange('qrFgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.qrFgColor || 'Theme accent'}</span>
              <button
                type="button"
                onClick={() => handleChange('qrFgColor', '')}
                disabled={!state.qrFgColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">QR Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedQrBgColor}
                onChange={(e) => handleChange('qrBgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.qrBgColor || 'Theme primary'}</span>
              <button
                type="button"
                onClick={() => handleChange('qrBgColor', '')}
                disabled={!state.qrBgColor}
                className="rounded-full border border-[color:var(--ui-item-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] transition-colors hover:border-[color:var(--ui-item-border-hover)] hover:text-[var(--ui-text)] disabled:cursor-default disabled:opacity-50"
              >
                Use theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
