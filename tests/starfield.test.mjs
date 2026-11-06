import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceStar, createStar, projectStar, starCount, FAR_DEPTH } from '../src/scripts/starfield-model.ts';

test('star pool stays bounded for small phones and large desktop canvases', () => {
  assert.equal(starCount(320, 500), 84);
  assert.equal(starCount(700, 1400), 140);
  assert.equal(starCount(10000, 10000), 440);
});

test('perspective flythrough expands points away from right-of-center focus', () => {
  const star = { x: .3, y: -.2, z: .7, size: 1, phase: 0, cyan: true };
  const before = projectStar(star, 1440, 775);
  assert.equal(advanceStar(star, .04, 1440, 775, () => .5), false);
  const after = projectStar(star, 1440, 775);
  assert.ok(after.x > before.x);
  assert.ok(after.y < before.y);
  assert.ok(after.radius > before.radius);
});

test('near-plane and out-of-view stars recycle in place instead of growing the pool', () => {
  const star = createStar(() => .5, true);
  const reference = star;
  star.z = .131;
  assert.equal(advanceStar(star, .05, 1440, 775, () => .5), true);
  assert.equal(star, reference);
  assert.equal(star.z, FAR_DEPTH);
  assert.equal(projectStar(star, 1440, 775).alpha, 0);
  star.x = 100;
  assert.equal(advanceStar(star, .01, 1440, 775, () => .5), true);
});

test('background resume cannot advance a star by an unbounded suspended delta', () => {
  const star = { x: 0, y: 0, z: .8, size: 1, phase: 0, cyan: false };
  advanceStar(star, 100, 1440, 775, () => .5);
  assert.ok(star.z > .79);
});
