'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSwitch, OptionsPanel, OptionsSection, OptionsPreview } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

const DEFAULT_API_URL = 'https://overtheedge.unbc.ca/wp-json/wp/v2/organization?per_page=100&_embed=wp:featuredmedia&org_status=181,183,182';

interface ClubSpotlightData {
  apiUrl: string;
  pageUrl: string;
  rotationSeconds: number;
  useCorsProxy: boolean;
  refreshMinutes: number;
  showQrCode: boolean;
  qrLabel: string;
}

export default function ClubSpotlightOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<ClubSpotlightData>({
    apiUrl: (data?.apiUrl as string) ?? '',
    pageUrl: (data?.pageUrl as string) ?? '',
    rotationSeconds: (data?.rotationSeconds as number) ?? 10,
    useCorsProxy: (data?.useCorsProxy as boolean) ?? false,
    refreshMinutes: (data?.refreshMinutes as number) ?? 30,
    showQrCode: (data?.showQrCode as boolean) ?? false,
    qrLabel: (data?.qrLabel as string) ?? 'Learn more',
  });

  useEffect(() => {
    if (data) {
      setState({
        apiUrl: (data.apiUrl as string) ?? '',
        pageUrl: (data.pageUrl as string) ?? '',
        rotationSeconds: (data.rotationSeconds as number) ?? 10,
        useCorsProxy: (data.useCorsProxy as boolean) ?? false,
        refreshMinutes: (data.refreshMinutes as number) ?? 30,
        showQrCode: (data.showQrCode as boolean) ?? false,
        qrLabel: (data.qrLabel as string) ?? 'Learn more',
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Data Source">

        <FormInput
          label="WP REST API URL"
          name="apiUrl"
          type="url"
          value={state.apiUrl}
          placeholder={DEFAULT_API_URL}
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          WordPress REST API endpoint for clubs. Fetches club names and featured images as structured JSON.
          Tried first before falling back to HTML scraping.
        </div>

        <FormInput
          label="Clubs Page URL (fallback)"
          name="pageUrl"
          type="url"
          value={state.pageUrl}
          placeholder="https://overtheedge.unbc.ca/clubs/"
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          Fallback HTML page to scrape if the REST API is unavailable.
        </div>

        <FormSwitch
          label="Use CORS Proxy"
          name="useCorsProxy"
          checked={state.useCorsProxy}
          onChange={handleChange}
        />

      </OptionsSection>

      <OptionsSection title="Display Settings" divider>

        <FormInput
          label="Rotation Speed (seconds)"
          name="rotationSeconds"
          type="number"
          value={state.rotationSeconds}
          min={4}
          max={120}
          onChange={handleChange}
        />

        <FormInput
          label="Refresh Interval (minutes)"
          name="refreshMinutes"
          type="number"
          value={state.refreshMinutes}
          min={5}
          max={1440}
          onChange={handleChange}
        />
      </OptionsSection>

      {/* QR Code */}
      <OptionsSection title="QR Code" divider>

        <FormSwitch
          label="Show QR Code"
          name="showQrCode"
          checked={state.showQrCode}
          onChange={handleChange}
        />
        <div className="text-xs text-[var(--ui-text-muted)] text-center">
          Shows a QR code linking to the current club&apos;s page on Over The Edge.
          The QR code updates automatically as clubs rotate.
        </div>

        {state.showQrCode && (
          <FormInput
            label="QR Label"
            name="qrLabel"
            type="text"
            value={state.qrLabel}
            placeholder="Learn more"
            onChange={handleChange}
          />
        )}
      </OptionsSection>

      {/* Preview */}
      <OptionsPreview>
          <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--color-accent)' }}>
            Club Spotlight
          </div>
          <div
            className="w-20 h-20 rounded-full border-2 mb-3 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-primary)]/30"
            style={{ borderColor: 'var(--color-accent)' }}
          />
          <div className="text-sm font-bold text-[var(--ui-text)]">Example Club Name</div>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: i === 0 ? 16 : 6,
                  backgroundColor: i === 0 ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
      </OptionsPreview>
    </OptionsPanel>
  );
}
