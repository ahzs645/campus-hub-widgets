const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

const SYSTEM_CORS_PROXY: string | undefined =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CORS_PROXY_URL as string) || undefined;

function shouldProxyUrl(targetUrl: string): boolean {
  if (!ABSOLUTE_HTTP_URL.test(targetUrl)) return false;

  if (typeof window !== 'undefined') {
    try {
      return new URL(targetUrl).origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  return true;
}

export function getCorsProxyUrl(): string | undefined {
  return SYSTEM_CORS_PROXY;
}

export function buildProxyUrl(targetUrl: string): string {
  const trimmedTargetUrl = targetUrl.trim();
  if (!trimmedTargetUrl) return targetUrl;

  const proxy = SYSTEM_CORS_PROXY;
  if (!proxy || !shouldProxyUrl(trimmedTargetUrl)) return trimmedTargetUrl;

  const base = proxy.replace(/\/?\??(?:url=)?$/i, '');
  return `${base}/?url=${encodeURIComponent(trimmedTargetUrl)}`;
}
