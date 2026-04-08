import { describe, expect, it } from 'vitest';
import {
  ISS_LIVE_URL,
  buildYouTubeLiveProbeUrl,
  isYouTubeChannelLikeInput,
  parseYouTubeLiveProbeHtml,
  resolveConfiguredStreamUrl,
  resolveStreamSource,
} from './stream-utils';

describe('stream-utils', () => {
  it('uses the ISS preset URL when no custom URL is provided', () => {
    expect(resolveConfiguredStreamUrl('', 'iss-live')).toBe(ISS_LIVE_URL);
  });

  it('builds probe URLs from handles and channel URLs', () => {
    expect(buildYouTubeLiveProbeUrl('@LofiGirl')).toBe(
      'https://www.youtube.com/@LofiGirl/live',
    );
    expect(buildYouTubeLiveProbeUrl('https://www.youtube.com/@LofiGirl')).toBe(
      'https://www.youtube.com/@LofiGirl/live',
    );
    expect(buildYouTubeLiveProbeUrl('UC12345678901234567890')).toBe(
      'https://www.youtube.com/channel/UC12345678901234567890/live',
    );
  });

  it('recognizes YouTube channel-like inputs', () => {
    expect(isYouTubeChannelLikeInput('@LofiGirl')).toBe(true);
    expect(isYouTubeChannelLikeInput('https://www.youtube.com/@LofiGirl/live')).toBe(true);
    expect(
      isYouTubeChannelLikeInput('https://www.youtube.com/watch?v=jfKfPfyJRdk'),
    ).toBe(false);
  });

  it('parses live probe HTML when YouTube serves a watch page', () => {
    const html =
      "window['ytPageType'] = \"watch\"; window['ytCommand'] = {\"watchEndpoint\":{\"videoId\":\"jfKfPfyJRdk\"}};";
    expect(parseYouTubeLiveProbeHtml(html)).toEqual({
      isLive: true,
      videoId: 'jfKfPfyJRdk',
    });
  });

  it('returns offline for channel pages with no active stream', () => {
    const html = "window['ytPageType'] = \"channel\";";
    expect(parseYouTubeLiveProbeHtml(html)).toEqual({
      isLive: false,
      videoId: null,
    });
  });

  it('auto-detects direct stream types', () => {
    expect(resolveStreamSource('https://example.com/live.m3u8', 'auto')?.kind).toBe('hls');
    expect(resolveStreamSource('https://example.com/movie.mp4', 'auto')?.kind).toBe('video');
    expect(resolveStreamSource('https://example.com/audio.mp3', 'auto')?.kind).toBe('audio');
  });

  it('treats YouTube channel URLs as live probes in auto mode', () => {
    expect(resolveStreamSource('https://www.youtube.com/@LofiGirl', 'auto')).toMatchObject({
      kind: 'youtube-live-probe',
      url: 'https://www.youtube.com/@LofiGirl/live',
    });
  });
});
