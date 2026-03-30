'use client';
import { useState, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import WiFiShareOptions from './WiFiShareOptions';

interface WiFiShareConfig {
  ssid?: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
  message?: string;
  showNetworkName?: boolean;
  showPassword?: boolean;
  bgColor?: string;
  textColor?: string;
  qrFgColor?: string;
  qrBgColor?: string;
}

function buildWifiString(ssid: string, password: string, encryption: string, hidden: boolean): string {
  const escapedSsid = ssid.replace(/([\\;,:"'])/g, '\\$1');
  const escapedPassword = password.replace(/([\\;,:"'])/g, '\\$1');
  return `WIFI:T:${encryption};S:${escapedSsid};P:${escapedPassword};H:${hidden ? 'true' : 'false'};;`;
}

export default function WiFiShareWidget({ config, theme }: WidgetComponentProps) {
  const c = config as WiFiShareConfig | undefined;
  const ssid = c?.ssid ?? '';
  const password = c?.password ?? '';
  const encryption = c?.encryption ?? 'WPA';
  const hidden = c?.hidden ?? false;
  const message = c?.message ?? 'Scan to Connect to WiFi!';
  const showNetworkName = c?.showNetworkName ?? true;
  const showPassword = c?.showPassword ?? true;
  const bgColor = c?.bgColor || theme.primary;
  const textColor = c?.textColor ?? '#ffffff';
  const qrFgColor = c?.qrFgColor ?? '#000000';
  const qrBgColor = c?.qrBgColor ?? '#ffffff';

  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ssid) {
      setDataUrl(null);
      return;
    }

    const wifiStr = buildWifiString(ssid, password, encryption, hidden);
    QRCodeLib.toDataURL(wifiStr, {
      errorCorrectionLevel: 'M',
      color: { dark: qrFgColor, light: qrBgColor },
      margin: 2,
      width: 512,
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [ssid, password, encryption, hidden, qrFgColor, qrBgColor]);

  if (!ssid) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="wifi" className="w-9 h-9 mb-3 text-white/70" />
        <span className="text-white/70 text-sm">No WiFi network configured</span>
        <span className="text-white/50 text-xs mt-1">Add your network details in settings</span>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {message && (
        <h2
          className="text-lg font-bold mb-4 text-center"
          style={{ color: textColor }}
        >
          {message}
        </h2>
      )}

      {dataUrl && (
        <img
          src={dataUrl}
          alt="WiFi QR Code"
          className="rounded-lg"
          style={{ maxWidth: '60%', maxHeight: '55%', objectFit: 'contain' }}
        />
      )}

      <div className="mt-4 text-center space-y-1">
        {showNetworkName && (
          <p className="text-sm font-medium" style={{ color: textColor }}>
            Network name : {ssid}
          </p>
        )}
        {showPassword && password && (
          <p className="text-sm font-medium" style={{ color: textColor }}>
            Password : {password}
          </p>
        )}
      </div>
    </div>
  );
}

registerWidget({
  type: 'wifi-share',
  name: 'WiFi Share',
  description: 'Share your WiFi network via QR code with customizable display',
  icon: 'wifi',
  minW: 2,
  minH: 3,
  defaultW: 3,
  defaultH: 4,
  component: WiFiShareWidget,
  OptionsComponent: WiFiShareOptions,
  defaultProps: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    message: 'Scan to Connect to WiFi!',
    showNetworkName: true,
    showPassword: true,
    bgColor: '#2563eb',
    textColor: '#ffffff',
    qrFgColor: '#000000',
    qrBgColor: '#ffffff',
  },
});
