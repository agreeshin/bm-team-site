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
