const IFRAME_SRC_PATTERN = /src=(["'])(.*?)\1/i;
const DIRECT_POWERPOINT_PATTERN = /\.(ppt|pptx|pps|ppsx)(\?|#|$)/i;
const SHAREPOINT_HOST_PATTERN = /(^|\.)sharepoint\.com$/i;

function extractIframeSrc(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('<iframe')) return trimmed;
  return trimmed.match(IFRAME_SRC_PATTERN)?.[2]?.trim() ?? trimmed;
}

function isOfficeAppsEmbedUrl(url: URL): boolean {
  return url.hostname === 'view.officeapps.live.com' && /\/op\/embed\.aspx$/i.test(url.pathname);
}

function isOneDriveEmbedUrl(url: URL): boolean {
  return url.hostname === 'onedrive.live.com' && /^\/embed$/i.test(url.pathname);
}

function isSharePointEmbedUrl(url: URL): boolean {
  return SHAREPOINT_HOST_PATTERN.test(url.hostname)
    && (url.searchParams.get('action') === 'embedview' || /\/embed/i.test(url.pathname));
}

export function buildPowerPointEmbedUrl(value?: string): string | null {
  const raw = extractIframeSrc(value ?? '');
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (isOfficeAppsEmbedUrl(url) || isOneDriveEmbedUrl(url) || isSharePointEmbedUrl(url)) {
    return url.toString();
  }

  if (url.hostname === 'onedrive.live.com' && url.searchParams.has('resid')) {
    const embedUrl = new URL('https://onedrive.live.com/embed');
    embedUrl.searchParams.set('resid', url.searchParams.get('resid')!);
    if (url.searchParams.has('authkey')) {
      embedUrl.searchParams.set('authkey', url.searchParams.get('authkey')!);
    }
    embedUrl.searchParams.set('em', '2');
    if (url.searchParams.has('wdAr')) {
      embedUrl.searchParams.set('wdAr', url.searchParams.get('wdAr')!);
    }
    return embedUrl.toString();
  }

  if (SHAREPOINT_HOST_PATTERN.test(url.hostname) && (url.searchParams.has('sourcedoc') || url.searchParams.has('docid'))) {
    url.searchParams.set('action', 'embedview');
    return url.toString();
  }

  if (DIRECT_POWERPOINT_PATTERN.test(url.pathname)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url.toString())}`;
  }

  return null;
}

export function looksLikePowerPointInput(value?: string): boolean {
  const raw = extractIframeSrc(value ?? '');
  if (!raw) return false;
  if (/powerpoint|officeapps|onedrive|sharepoint/i.test(raw)) return true;
  return DIRECT_POWERPOINT_PATTERN.test(raw);
}
