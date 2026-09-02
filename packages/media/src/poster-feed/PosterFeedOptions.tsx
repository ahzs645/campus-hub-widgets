'use client';
import { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';

interface PosterFeedData {
  feedUrl: string;
  rotationSeconds: number;
  animationMode: string;
}

const ANIMATION_MODES = [
  { value: 'stack', label: 'Stack' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'fade', label: 'Fade' },
];

export default function PosterFeedOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<PosterFeedData>({
    feedUrl: (data?.feedUrl as string) ?? '',
    rotationSeconds: (data?.rotationSeconds as number) ?? 8,
    animationMode: (data?.animationMode as string) ?? 'stack',
  });

  useEffect(() => {
    if (data) {
      setState({
        feedUrl: (data.feedUrl as string) ?? '',
        rotationSeconds: (data.rotationSeconds as number) ?? 8,
        animationMode: (data.animationMode as string) ?? 'stack',
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
      {/* RSS Feed */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">RSS Feed Source</h3>

        <FormInput
          label="Feed URL"
          name="feedUrl"
          type="url"
          value={state.feedUrl}
          placeholder="https://example.com/feed.xml"
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Enter an RSS feed URL. Images will be extracted from feed items automatically.
          Leave empty to show sample posters.
        </div>
      </div>

      {/* Animation */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <h3 className="font-semibold text-[var(--ui-text)]">Display Settings</h3>

        <FormSelect
          label="Animation Mode"
          name="animationMode"
          value={state.animationMode}
          options={ANIMATION_MODES}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          {state.animationMode === 'stack' && 'Stacked cards with rotation. One active poster at a time with sliding text.'}
          {state.animationMode === 'carousel' && '3D perspective carousel. Cards fan out with depth and smooth transitions.'}
          {state.animationMode === 'fade' && 'Full-bleed crossfade with Ken Burns zoom effect and progress bar.'}
        </div>

        <FormInput
          label="Rotation Speed (seconds)"
          name="rotationSeconds"
          type="number"
          value={state.rotationSeconds}
          min={3}
          max={120}
          onChange={handleChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Each poster displays for {state.rotationSeconds} seconds before advancing.
        </div>
      </div>

    </div>
  );
}
