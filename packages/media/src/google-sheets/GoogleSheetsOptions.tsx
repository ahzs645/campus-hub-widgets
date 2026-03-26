'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSwitch } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface GoogleSheetsData {
  url: string;
  sheetName: string;
  cellRange: string;
  showTitle: boolean;
  title: string;
  zoom: number;
  refreshInterval: number;
}

export default function GoogleSheetsOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<GoogleSheetsData>({
    url: (data?.url as string) ?? '',
    sheetName: (data?.sheetName as string) ?? '',
    cellRange: (data?.cellRange as string) ?? '',
    showTitle: (data?.showTitle as boolean) ?? false,
    title: (data?.title as string) ?? '',
    zoom: (data?.zoom as number) ?? 100,
    refreshInterval: (data?.refreshInterval as number) ?? 300,
  });

  useEffect(() => {
    if (data) {
      setState({
        url: (data.url as string) ?? '',
        sheetName: (data.sheetName as string) ?? '',
        cellRange: (data.cellRange as string) ?? '',
        showTitle: (data.showTitle as boolean) ?? false,
        title: (data.title as string) ?? '',
        zoom: (data.zoom as number) ?? 100,
        refreshInterval: (data.refreshInterval as number) ?? 300,
      });
    }
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    onChange(newState);
  };

  const isValidUrl = state.url.includes('docs.google.com/spreadsheets');

  return (
    <div className="space-y-6">
      {/* Sheet URL */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Google Sheet</h3>

        <FormInput
          label="Sheet URL"
          name="url"
          type="url"
          value={state.url}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          onChange={handleChange}
        />

        {state.url && !isValidUrl && (
          <div className="text-sm text-red-400">
            This doesn&apos;t look like a Google Sheets URL.
          </div>
        )}

        <div className="bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-strong)] rounded-lg p-4">
          <div className="flex gap-2">
            <AppIcon name="info" className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[var(--ui-text-muted)]">
              <strong>How to get the URL:</strong> In Google Sheets, go to File → Share → Publish to the web.
              Select the sheet or chart you want to display, click Publish, and paste the link here.
              Google updates published sheets about every 5 minutes.
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Options */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Sheet Options</h3>

        <FormInput
          label="Sheet Name"
          name="sheetName"
          type="text"
          value={state.sheetName}
          placeholder="Sheet1 (leave empty for default)"
          onChange={handleChange}
        />

        <FormInput
          label="Cell Range"
          name="cellRange"
          type="text"
          value={state.cellRange}
          placeholder="A1:D10 (leave empty for entire sheet)"
          onChange={handleChange}
        />

        <FormInput
          label="Zoom %"
          name="zoom"
          type="number"
          value={state.zoom}
          min={25}
          max={200}
          onChange={handleChange}
        />

        <FormInput
          label="Refresh Interval (seconds)"
          name="refreshInterval"
          type="number"
          value={state.refreshInterval}
          min={0}
          max={3600}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Default is 300s (5 min) to match Google&apos;s publish update interval. Set to 0 to disable.
        </div>
      </div>

      {/* Title Bar */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Title Bar</h3>

        <FormSwitch
          label="Show Title Bar"
          name="showTitle"
          checked={state.showTitle}
          onChange={handleChange}
        />

        {state.showTitle && (
          <FormInput
            label="Title"
            name="title"
            type="text"
            value={state.title}
            placeholder="My Spreadsheet"
            onChange={handleChange}
          />
        )}
      </div>

      {/* Preview */}
      <div className="border-t border-[color:var(--ui-item-border)] pt-6">
        <h4 className="font-semibold text-[var(--ui-text)] mb-4">Preview</h4>
        <div className="bg-[var(--ui-item-bg)] rounded-xl aspect-video flex items-center justify-center">
          {isValidUrl ? (
            <div className="text-center">
              <AppIcon name="table" className="w-9 h-9 mx-auto text-white/80" />
              <div className="text-white/70 text-sm mt-2">Google Sheet configured</div>
              {state.cellRange && (
                <div className="text-white/50 text-xs mt-1">Range: {state.cellRange}</div>
              )}
              <div className="text-white/50 text-xs mt-1">Zoom: {state.zoom}%</div>
            </div>
          ) : (
            <div className="text-center">
              <AppIcon name="table" className="w-9 h-9 opacity-50 mx-auto text-white/70" />
              <div className="text-white/50 text-sm mt-2">No sheet configured</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
