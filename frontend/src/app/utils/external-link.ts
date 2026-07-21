const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

export function openExternalLink(url: string | null | undefined): boolean {
  if (!url || typeof window === 'undefined') {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol)) {
      return false;
    }

    window.open(parsedUrl.href, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}
