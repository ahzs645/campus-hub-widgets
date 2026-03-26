'use client';
import { useState, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import { FormInput, FormSelect, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
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

export default function WiFiShareOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<WiFiShareData>({
    ssid: (data?.ssid as string) ?? '',
    password: (data?.password as string) ?? '',
    encryption: (data?.encryption as 'WPA' | 'WEP' | 'nopass') ?? 'WPA',
    hidden: (data?.hidden as boolean) ?? false,
    message: (data?.message as string) ?? 'Scan to Connect to WiFi!',
    showNetworkName: (data?.showNetworkName as boolean) ?? true,
    showPassword: (data?.showPassword as boolean) ?? true,
    bgColor: (data?.bgColor as string) ?? '#2563eb',
    textColor: (data?.textColor as string) ?? '#ffffff',
    qrFgColor: (data?.qrFgColor as string) ?? '#000000',
    qrBgColor: (data?.qrBgColor as string) ?? '#ffffff',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        bgColor: (data.bgColor as string) ?? '#2563eb',
        textColor: (data.textColor as string) ?? '#ffffff',
        qrFgColor: (data.qrFgColor as string) ?? '#000000',
        qrBgColor: (data.qrBgColor as string) ?? '#ffffff',
      });
    }
  }, [data]);

  useEffect(() => {
    if (!state.ssid) {
      setPreviewUrl(null);
      return;
    }

    const wifiStr = `WIFI:T:${state.encryption};S:${state.ssid};P:${state.password};H:${state.hidden ? 'true' : 'false'};;`;
    QRCodeLib.toDataURL(wifiStr, {
      errorCorrectionLevel: 'M',
      color: { dark: state.qrFgColor, light: state.qrBgColor },
      margin: 2,
      width: 256,
    })
      .then(setPreviewUrl)
      .catch(() => setPreviewUrl(null));
  }, [state.ssid, state.password, state.encryption, state.hidden, state.qrFgColor, state.qrBgColor]);

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.bgColor}
                onChange={(e) => handleChange('bgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.bgColor}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.textColor}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">QR Foreground</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.qrFgColor}
                onChange={(e) => handleChange('qrFgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.qrFgColor}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--ui-text-muted)]">QR Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.qrBgColor}
                onChange={(e) => handleChange('qrBgColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--ui-input-border)]"
              />
              <span className="text-xs text-[var(--ui-text-muted)]">{state.qrBgColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="font-semibold text-[var(--ui-text)] mb-4">Preview</h4>
        <div
          className="rounded-xl flex flex-col items-center justify-center overflow-hidden p-6"
          style={{ backgroundColor: state.bgColor, aspectRatio: '3/4' }}
        >
          {state.ssid ? (
            <>
              {state.message && (
                <p className="text-sm font-bold mb-3 text-center" style={{ color: state.textColor }}>
                  {state.message}
                </p>
              )}
              {previewUrl && (
                <img src={previewUrl} alt="WiFi QR Preview" className="rounded max-w-[70%]" />
              )}
              <div className="mt-3 text-center space-y-0.5">
                {state.showNetworkName && (
                  <p className="text-xs" style={{ color: state.textColor }}>
                    Network name : {state.ssid}
                  </p>
                )}
                {state.showPassword && state.password && (
                  <p className="text-xs" style={{ color: state.textColor }}>
                    Password : {state.password}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <AppIcon name="wifi" className="w-9 h-9 opacity-50 mx-auto text-white/70" />
              <div className="text-white/50 text-sm mt-2">Enter network details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
