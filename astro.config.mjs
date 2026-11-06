import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { resolveSiteUrl } from './src/lib/site-url.mjs';

const environment = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const site = resolveSiteUrl(process.env.SITE_URL ?? environment.SITE_URL);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
});
