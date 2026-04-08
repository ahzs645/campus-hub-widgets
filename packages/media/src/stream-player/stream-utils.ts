import {
  detectVideoSource,
  extractVideoIdFromUrl,
} from '@firstform/campus-hub-widget-sdk';

export type StreamPreset = 'custom' | 'iss-live';
export type StreamFormat =
  | 'auto'
  | 'youtube-video'
  | 'youtube-channel-live'
  | 'vimeo'
  | 'hls'
  | 'video'
  | 'audio'
  | 'embed';

export type ResolvedStreamKind =
  | 'youtube'
  | 'youtube-live-probe'
  | 'vimeo'
  | 'hls'
  | 'video'
  | 'audio'
  | 'embed';

export interface StreamPlaybackOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export interface ResolvedStreamSource {
  kind: ResolvedStreamKind;
  sourceUrl: string;
  url: string;
  videoId?: string | null;
}

export interface YouTubeLiveProbeResult {
  isLive: boolean;
  videoId: string | null;
}

export const ISS_LIVE_URL = 'https://www.youtube.com/embed/fO9e9jnhYK8';

const VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.ogv',
  '.ogg',
  '.mkv',
];

const AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.oga',
  '.flac',
];

function resolveAbsoluteUrl(value: string): string {
  if (typeof window === 'undefined' || !value) {
    return value;
  }

  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(value, window.location.href).toString();
    } catch {
      return value;
    }
  }
}

function getUrlPathname(value: string): string {
  try {
    return new URL(resolveAbsoluteUrl(value)).pathname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function hasKnownExtension(value: string, extensions: string[]): boolean {
  const pathname = getUrlPathname(value);
  return extensions.some((extension) => pathname.endsWith(extension));
}

export function resolveConfiguredStreamUrl(url: string, preset: StreamPreset): string {
  const trimmed = url.trim();
  if (trimmed) {
    return resolveAbsoluteUrl(trimmed);
  }

  if (preset === 'iss-live') {
    return ISS_LIVE_URL;
  }

  return '';
}

export function isHlsUrl(value: string): boolean {
  return hasKnownExtension(value, ['.m3u8']);
}

export function isVideoUrl(value: string): boolean {
  return hasKnownExtension(value, VIDEO_EXTENSIONS);
}

export function isAudioUrl(value: string): boolean {
  return hasKnownExtension(value, AUDIO_EXTENSIONS);
}

export function isYouTubeChannelLikeInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('@')) return true;
  if (/^UC[\w-]{20,}$/.test(trimmed)) return true;

  try {
    const url = new URL(resolveAbsoluteUrl(trimmed));
    const host = url.hostname.toLowerCase();
    if (!host.includes('youtube.com')) {
      return false;
    }

    const path = url.pathname.replace(/\/+$/, '');
    if (/^\/watch$/i.test(path) || /^\/embed\//i.test(path) || /^\/shorts\//i.test(path)) {
      return false;
    }

    return (
      /^\/@[^/]+(?:\/live)?$/i.test(path) ||
      /^\/channel\/[^/]+(?:\/live)?$/i.test(path) ||
      /^\/(?:c|user)\/[^/]+(?:\/live)?$/i.test(path)
    );
  } catch {
    return false;
  }
}

export function buildYouTubeLiveProbeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('@')) {
    return `https://www.youtube.com/${trimmed.replace(/\/+$/, '')}/live`;
  }

  if (/^UC[\w-]{20,}$/.test(trimmed)) {
    return `https://www.youtube.com/channel/${trimmed}/live`;
  }

  try {
    const url = new URL(resolveAbsoluteUrl(trimmed));
    const host = url.hostname.toLowerCase();
    if (!host.includes('youtube.com')) {
      return resolveAbsoluteUrl(trimmed);
    }

    const path = url.pathname.replace(/\/+$/, '');
    if (/\/live$/i.test(path)) {
      return `https://www.youtube.com${path}`;
    }

    if (/^\/@[^/]+$/i.test(path)) {
      return `https://www.youtube.com${path}/live`;
    }

    if (/^\/channel\/[^/]+$/i.test(path)) {
      return `https://www.youtube.com${path}/live`;
    }

    if (/^\/(?:c|user)\/[^/]+$/i.test(path)) {
      return `https://www.youtube.com${path}/live`;
    }

    return `https://www.youtube.com${path}/live`;
  } catch {
    return `https://www.youtube.com/@${trimmed.replace(/^@+/, '')}/live`;
  }
}

export function buildYouTubeEmbedUrl(
  value: string,
  playback: StreamPlaybackOptions = {},
): string {
  const videoId = extractVideoIdFromUrl(value);
  if (!videoId) {
    return resolveAbsoluteUrl(value);
  }

  const params = new URLSearchParams({
    autoplay: playback.autoplay ? '1' : '0',
    mute: playback.muted ? '1' : '0',
    loop: playback.loop ? '1' : '0',
    controls: playback.controls === false ? '0' : '1',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
  });

  if (playback.loop) {
    params.set('playlist', videoId);
  }

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
    params.set('widget_referrer', window.location.origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function buildVimeoEmbedUrl(
  value: string,
  playback: StreamPlaybackOptions = {},
): string {
  const videoId = extractVideoIdFromUrl(value);
  if (!videoId) {
    return resolveAbsoluteUrl(value);
  }

  const params = new URLSearchParams({
    autoplay: playback.autoplay ? '1' : '0',
    muted: playback.muted ? '1' : '0',
    loop: playback.loop ? '1' : '0',
    controls: playback.controls === false ? '0' : '1',
    title: '0',
    byline: '0',
    portrait: '0',
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

export function parseYouTubeLiveProbeHtml(html: string): YouTubeLiveProbeResult {
  const pageType = html.match(/window\['ytPageType'\]\s*=\s*"([^"]+)"/)?.[1];
  if (pageType !== 'watch') {
    return { isLive: false, videoId: null };
  }

  const videoId =
    html.match(/"watchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1] ??
    html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1] ??
    null;

  return {
    isLive: Boolean(videoId),
    videoId,
  };
}

export function resolveStreamSource(
  value: string,
  format: StreamFormat,
  playback: StreamPlaybackOptions = {},
): ResolvedStreamSource | null {
  const sourceUrl = resolveAbsoluteUrl(value.trim());
  if (!sourceUrl) {
    return null;
  }

  if (format === 'youtube-channel-live') {
    return {
      kind: 'youtube-live-probe',
      sourceUrl,
      url: buildYouTubeLiveProbeUrl(sourceUrl),
    };
  }

  if (format === 'youtube-video') {
    return {
      kind: 'youtube',
      sourceUrl,
      url: buildYouTubeEmbedUrl(sourceUrl, playback),
      videoId: extractVideoIdFromUrl(sourceUrl),
    };
  }

  if (format === 'vimeo') {
    return {
      kind: 'vimeo',
      sourceUrl,
      url: buildVimeoEmbedUrl(sourceUrl, playback),
      videoId: extractVideoIdFromUrl(sourceUrl),
    };
  }

  if (format === 'hls') {
    return { kind: 'hls', sourceUrl, url: sourceUrl };
  }

  if (format === 'video') {
    return { kind: 'video', sourceUrl, url: sourceUrl };
  }

  if (format === 'audio') {
    return { kind: 'audio', sourceUrl, url: sourceUrl };
  }

  if (format === 'embed') {
    return { kind: 'embed', sourceUrl, url: sourceUrl };
  }

  if (isYouTubeChannelLikeInput(sourceUrl)) {
    return {
      kind: 'youtube-live-probe',
      sourceUrl,
      url: buildYouTubeLiveProbeUrl(sourceUrl),
    };
  }

  const detectedSource = detectVideoSource(sourceUrl);
  if (detectedSource === 'youtube') {
    const videoId = extractVideoIdFromUrl(sourceUrl);
    if (videoId) {
      return {
        kind: 'youtube',
        sourceUrl,
        url: buildYouTubeEmbedUrl(sourceUrl, playback),
        videoId,
      };
    }
  }

  if (detectedSource === 'vimeo') {
    return {
      kind: 'vimeo',
      sourceUrl,
      url: buildVimeoEmbedUrl(sourceUrl, playback),
      videoId: extractVideoIdFromUrl(sourceUrl),
    };
  }

  if (isHlsUrl(sourceUrl)) {
    return { kind: 'hls', sourceUrl, url: sourceUrl };
  }

  if (isAudioUrl(sourceUrl)) {
    return { kind: 'audio', sourceUrl, url: sourceUrl };
  }

  if (isVideoUrl(sourceUrl)) {
    return { kind: 'video', sourceUrl, url: sourceUrl };
  }

  return { kind: 'embed', sourceUrl, url: sourceUrl };
}
