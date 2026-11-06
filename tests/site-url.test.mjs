import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiteUrl } from '../src/lib/site-url.mjs';

test('preview has no production origin', () => {
  assert.equal(resolveSiteUrl(undefined), undefined);
  assert.equal(resolveSiteUrl('  '), undefined);
});

test('deployment URL is normalized to its real HTTPS origin', () => {
  assert.equal(resolveSiteUrl(' https://ursa-major.tech/ '), 'https://ursa-major.tech');
});

test('local, placeholder and ambiguous deployment URLs fail fast', () => {
  for (const value of ['not a url', 'http://ursa-major.tech', 'https://localhost',
    'https://127.0.0.1', 'https://example.com', 'https://demo.invalid',
    'https://ursa-major.tech/path', 'https://ursa-major.tech:4321',
    'https://ursa-major.tech/?q=1', 'https://user:password@ursa-major.tech']) {
    assert.throws(() => resolveSiteUrl(value), /SITE_URL/);
  }
});
