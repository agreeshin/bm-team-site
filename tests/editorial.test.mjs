import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('approved literature description is exact and project chips/numbered décor stay removed', () => {
  assert.ok(source.includes('<p>ИИ - краткие содержания литературных произведений с профессиональной озвучкой</p>'));
  assert.doesNotMatch(source, /case-tags|service-tags|case-meta|case-status|process-number|process-output|photo-label|prototype-label|section-topline|ДОСТУПЕН ОНЛАЙН/);
});

test('concise project copy retains prototype, software scope and exact direct contacts', () => {
  assert.ok(source.includes('Прототип автономного дрона'));
  assert.ok(source.includes('ПО управления гидрографическим дроном'));
  assert.ok(source.includes('участвовали в инженерной разработке'));
  for (const value of ['href="tel:+79320112811"', '+7 932 011-28-11',
    'href="mailto:greeshin.anatoly@yandex.ru"', 'ИП Гришин Анатолий Александрович', '317665800027995']) {
    assert.ok(source.includes(value), value);
  }
});

test('approved service wording and four uniform single-image project rows are preserved', () => {
  assert.equal((source.match(/>Сделаем для Вас</g) || []).length, 2);
  assert.ok(source.includes("title: 'Автоматизируйте рутину. Масштабируйте прибыль'"));
  assert.ok(source.includes("title: 'ИИ помощник ответит клиентам'"));
  assert.equal((source.match(/<article class="case case-/g) || []).length, 4);
  assert.equal((source.match(/class="case-copy"/g) || []).length, 4);
  assert.doesNotMatch(source, /moltApp|molt-app|operator-strip|case-pair|small-case/);
});

test('header is one transparent SVG lockup with three text lines and no separate wordmark or arrow', async () => {
  assert.ok(source.includes('<div class="header-inner">'));
  const brand = source.match(/<a\b[^>]*class="brand"[^>]*>([\s\S]*?)<\/a>/)?.[1];
  assert.ok(brand);
  assert.match(brand, /<svg\b[^>]*class="brand-lockup"[^>]*aria-hidden="true"/);
  assert.match(brand, /<image\b[^>]*href=\{brandMark\.src\}/);
  for (const line of ['URSA', 'MAJOR', 'TECH']) {
    assert.match(brand, new RegExp(`<text\\b[^>]*>${line}</text>`));
  }
  assert.match(brand, /<text\b[^>]*class="brand-lockup-main"[^>]*fill="#edf1ee"/);
  assert.match(brand, /<text\b[^>]*class="brand-lockup-accent"[^>]*fill="#a3e4ec"/);
  assert.doesNotMatch(brand, /<rect\b|<img\b|<ArrowIcon\b|brand-name|brand-dot|logo\.src/);
  assert.doesNotMatch(source, /brand-name|brand-dot/);
  const arrow = await readFile(new URL('../src/components/ArrowIcon.astro', import.meta.url), 'utf8');
  for (const attribute of ['stroke="currentColor"', 'stroke-width="2.2"', 'stroke-linecap="round"', 'stroke-linejoin="round"']) {
    assert.ok(arrow.includes(attribute));
  }
});

test('lime CTA glow halves only the supplied normal and hover alpha values', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(css, /\.button-lime\s*\{[^}]*background:\s*var\(--lime\)[^}]*box-shadow:\s*0 0 24px #dafa8320, 0 10px 44px #dafa8318/);
  assert.match(css, /\.button-lime:hover\s*\{[^}]*background:\s*#e7ffb1[^}]*transform:\s*translateY\(-2px\)[^}]*box-shadow:\s*0 0 32px #dafa8330, 0 14px 56px #dafa8320/);
});
