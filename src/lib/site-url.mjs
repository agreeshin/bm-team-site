/**
 * An unconfigured build is a non-indexable preview. Invalid deployment settings
 * fail the build instead of publishing a misleading canonical origin.
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
export function resolveSiteUrl(value) {
  if (!value?.trim()) return undefined;

  let url;
  try {
    url = new URL(value.trim());
  } catch (cause) {
    throw new Error('SITE_URL must be a real HTTPS origin, for example https://your-domain.tld', { cause });
  }

  const host = url.hostname.toLowerCase();
  const reservedHost = host === 'localhost' || host.endsWith('.localhost')
    || host === 'example.com' || host.endsWith('.example.com')
    || host === 'example.org' || host === 'example.net'
    || host.endsWith('.example') || host.endsWith('.invalid')
    || host.endsWith('.test') || host === '[::1]'
    || /^\d+(\.\d+){3}$/.test(host) || !host.includes('.');

  if (url.protocol !== 'https:' || reservedHost || url.username || url.password
    || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be a public HTTPS origin without a path, port, credentials, query or hash');
  }

  return url.origin;
}
