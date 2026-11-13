import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('browser title and runtime metadata use the approved Медведь Софт name', () => {
  assert.ok(source.includes("const title = 'Медведь Софт — ИИ и автоматизация бизнес-процессов';"));
  assert.ok(source.includes("const description = 'Автоматизируем рутину, обработку документов и работу с данными. ИИ-ассистенты, интеграции и инженерная разработка Медведь Софт — от пилота до внедрения.';"));
  assert.match(source, /const organization = \{[\s\S]*?\n  name: 'Медведь Софт',/);
  assert.ok(source.includes('<title>{title}</title>'));
  assert.ok(source.includes('<meta property="og:site_name" content="Медведь Софт" />'));
  assert.ok(source.includes('<meta name="description" content={description} />'));
  for (const platform of ['og', 'twitter']) {
    assert.ok(source.includes(`${platform}:title" content={title}`));
    assert.ok(source.includes(`${platform}:description" content={description}`));
  }
  assert.doesNotMatch(source, /Ursa\s+Major\s+Tech|ursa-major-tech|UMT-logo\.(?:svg|png)|\/brand-(?:mark|logo(?:-light)?)\.svg/i);
});

test('package metadata consistently uses medved-soft-site', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const packageLock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.name, 'medved-soft-site');
  assert.equal(packageLock.name, 'medved-soft-site');
  assert.equal(packageLock.packages[''].name, 'medved-soft-site');
});

test('social preview asset is a ready-to-use 1024 by 975 PNG', async () => {
  const png = await readFile(new URL('../assets/brand/medved-soft-logo-social.png', import.meta.url));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.readUInt32BE(16), 1024);
  assert.equal(png.readUInt32BE(20), 975);
});

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

test('header and footer use the approved horizontal logo asset and accessible brand links', () => {
  assert.match(source, /import logoHorizontal from '\.\.\/\.\.\/assets\/brand\/medved-soft-logo-horizontal-light\.svg';/);
  assert.ok(source.includes('<div class="header-inner">'));
  for (const className of ['brand', 'footer-brand']) {
    const brand = source.match(new RegExp(`<a\\b[^>]*class="${className}"[^>]*>[\\s\\S]*?</a>`))?.[0];
    assert.ok(brand, `${className} link exists`);
    assert.match(brand, /href="#top"/);
    assert.match(brand, /aria-label="МЕДВЕДЬ СОФТ — в начало страницы"/);
    assert.equal((brand.match(/<img\b/g) || []).length, 1);
    assert.match(brand, /<img\b[^>]*src=\{logoHorizontal\.src\}/);
    assert.match(brand, /width=\{logoHorizontal\.width\}/);
    assert.match(brand, /height=\{logoHorizontal\.height\}/);
    assert.match(brand, /alt=""/);
    assert.doesNotMatch(brand, /<svg\b|<image\b|<text\b|<ArrowIcon\b|URSA|MAJOR|TECH/);
  }
  assert.equal((source.match(/src=\{logoHorizontal\.src\}/g) || []).length, 2);
  assert.doesNotMatch(source, /brand-lockup|brand-name|brand-dot|UMT-logo\.(?:svg|png)|\/brand-mark\.svg/);
});

test('organization, social image and favicon reference the new logo assets', () => {
  assert.match(source, /import logo from '\.\.\/\.\.\/assets\/brand\/medved-soft-logo\.svg';/);
  assert.match(source, /import brandMark from '\.\.\/\.\.\/assets\/brand\/medved-soft-mark-light\.svg';/);
  assert.match(source, /import logoSocial from '\.\.\/\.\.\/assets\/brand\/medved-soft-logo-social\.png';/);
  assert.match(source, /getImage\(\{ src: logoSocial, format: 'png', width: 1024 \}\)/);
  assert.match(source, /logo: new URL\(logo\.src, Astro\.site\)\.href/);
  assert.match(source, /<link\b[^>]*rel="icon"[^>]*type="image\/svg\+xml"[^>]*href=\{brandMark\.src\}/);
  for (const [attribute, property] of [['property', 'og:image'], ['name', 'twitter:image']]) {
    assert.ok(source.includes(`${attribute}="${property}" content={new URL(socialImage.src, Astro.site).href}`), property);
  }
  assert.ok(source.includes('property="og:image:width" content={String(socialImage.attributes.width)}'));
  assert.ok(source.includes('property="og:image:height" content={String(socialImage.attributes.height)}'));
  assert.ok(source.includes('property="og:image:alt" content="Логотип команды МЕДВЕДЬ СОФТ"'));
  assert.doesNotMatch(source, /href="\/favicon\.svg"|logoPng/);
});

test('logo sizing keeps the header breakpoints and footer aspect ratio', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(css, /\.brand-logo\s*\{[^}]*width:\s*208px;[^}]*height:\s*auto;/);
  assert.match(css, /@media \(max-width: 900px\)\s*\{[\s\S]*?\.brand-logo\s*\{\s*width:\s*195px;/);
  assert.match(css, /@media \(max-width: 700px\)\s*\{[\s\S]*?\.brand-logo\s*\{\s*width:\s*166px;/);
  assert.match(css, /\.footer-brand-logo\s*\{[^}]*width:\s*166px;[^}]*height:\s*auto;/);
  assert.doesNotMatch(css, /brand-lockup/);
});

test('shared arrow retains its approved stroke style', async () => {
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
