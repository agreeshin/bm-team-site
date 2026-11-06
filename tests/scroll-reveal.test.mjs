import test from 'node:test';
import assert from 'node:assert/strict';
import { initScrollReveal } from '../src/scripts/scroll-reveal.ts';

function setup(t, count = 2, reduced = false) {
  const originals = new Map();
  const observers = [];
  class FakeElement {
    dataset = {};
    style = {};
    animations = [];
    animate(frames, options) {
      const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; this.oncancel?.(); } };
      this.animations.push(animation);
      return animation;
    }
  }
  class Observer {
    targets = new Set();
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    enter(target) { this.callback([{ target, isIntersecting: true }]); }
  }
  const targets = Array.from({ length: count }, () => new FakeElement());
  const document = Object.assign(new EventTarget(), { hidden: false, querySelectorAll: () => targets });
  const window = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const connection = Object.assign(new EventTarget(), { saveData: false });
  for (const [name, value] of Object.entries({ document, window, Element: FakeElement,
    IntersectionObserver: Observer, matchMedia: () => media, navigator: { connection } })) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return { targets, observers, document, window, media, connection };
}

test('reveal runs once, unobserves its target and releases completed animations', (t) => {
  const { targets, observers } = setup(t);
  const dispose = initScrollReveal();
  targets[0].dataset.revealDelay = '80';
  observers[0].enter(targets[0]);
  observers[0].enter(targets[0]);
  assert.equal(targets[0].animations.length, 1);
  assert.equal(observers[0].targets.has(targets[0]), false);
  assert.equal(targets[0].animations[0].options.duration, 650);
  assert.equal(targets[0].animations[0].options.fill, 'backwards');
  assert.equal(targets[0].animations[0].options.delay, 80);
  assert.equal(observers[0].options.threshold, 0);
  assert.equal(observers[0].options.rootMargin, '0px 0px 32px 0px');
  targets[0].animations[0].onfinish();
  assert.equal(targets[0].animations[0].cancelled, true);
  assert.deepEqual(targets[0].style, {});
  dispose();
  assert.equal(observers[0].targets.size, 0);
});

test('initial/runtime reduced motion and Save-Data suppress and cancel reveal', (t) => {
  const { targets, observers, media, connection } = setup(t, 2, true);
  const dispose = initScrollReveal();
  assert.equal(observers.length, 0);
  media.matches = false;
  media.dispatchEvent(new Event('change'));
  observers[0].enter(targets[0]);
  connection.saveData = true;
  connection.dispatchEvent(new Event('change'));
  assert.equal(targets[0].animations[0].cancelled, true);
  assert.equal(observers[0].targets.size, 0);
  assert.equal(targets[1].dataset.revealed, undefined);
  dispose();
});

test('BFCache pauses/resumes pending targets and permanent cleanup removes callbacks', (t) => {
  const { targets, observers, window, media } = setup(t);
  const dispose = initScrollReveal();
  observers[0].enter(targets[0]);
  const hide = Object.assign(new Event('pagehide'), { persisted: true });
  window.dispatchEvent(hide);
  assert.equal(targets[0].animations[0].cancelled, true);
  window.dispatchEvent(new Event('pageshow'));
  assert.equal(observers[1].targets.has(targets[0]), false);
  assert.equal(observers[1].targets.has(targets[1]), true);
  dispose();
  window.dispatchEvent(new Event('pageshow'));
  media.dispatchEvent(new Event('change'));
  assert.equal(observers.length, 2);
  assert.equal(observers[1].targets.size, 0);
});

test('target budget is bounded and observer failure never hides base content', (t) => {
  const { targets, observers } = setup(t, 40);
  const dispose = initScrollReveal();
  assert.equal(observers[0].targets.size, 24);
  dispose();
  globalThis.IntersectionObserver = class { constructor() { throw new Error('unavailable'); } };
  const disposeFailed = initScrollReveal();
  for (const target of targets) { assert.deepEqual(target.style, {}); assert.equal(target.animations.length, 0); }
  disposeFailed();
});
