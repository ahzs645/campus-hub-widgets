import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SourcePickerProvider,
  getSourceReferences,
  type SourcePickRequest,
} from '@firstform/campus-hub-widget-sdk';
import StreamPlayerOptions from './StreamPlayerOptions';

afterEach(cleanup);

describe('Stream Player fallback source picker', () => {
  it('targets fallbackUrl and preserves the linked primary stream', () => {
    const pickSource = vi.fn<(request: SourcePickRequest) => void>();
    const onChange = vi.fn();
    const data = {
      url: 'https://example.edu/primary.m3u8',
      __sourceRef: { sourceId: 'primary', propName: 'url' },
    };
    render(
      <SourcePickerProvider value={pickSource}>
        <StreamPlayerOptions data={data} onChange={onChange} />
      </SourcePickerProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose a saved fallback source' }));
    const request = pickSource.mock.calls[0][0];
    expect(request.bindings).toEqual([
      expect.objectContaining({ propName: 'fallbackUrl', independent: true }),
    ]);

    act(() => request.onSelect({
      _id: 'fallback',
      name: 'Fallback',
      sourceType: 'video',
      url: 'https://example.edu/fallback.mp4',
    }));
    const next = onChange.mock.calls[0][0];
    expect(next).toMatchObject({
      url: data.url,
      fallbackUrl: 'https://example.edu/fallback.mp4',
    });
    expect(getSourceReferences(next).map((reference) => reference.sourceId)).toEqual([
      'primary',
      'fallback',
    ]);
  });
});
