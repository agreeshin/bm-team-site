import { advanceStar, createStar, projectStar, starCount, type Star } from './starfield-model';

/**
 * Independent Canvas2D implementation inspired by the public Stars Galaxy
 * description (Shivansh Arora / Framer). No Framer component source is reused.
 * One hero owns <=440 stars, <=4M canvas pixels and one 30fps RAF chain.
 */
export function initStarfield(): () => void {
  const host = document.querySelector<HTMLElement>('[data-starfield]');
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas');
  if (!host || !canvas) return () => {};
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return () => {};

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
  let stars: Star[] = [];
  let width = 0;
  let height = 0;
  let visible = false;
  let disposed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;

  const allowed = () => !disposed && visible && !document.hidden && !motion.matches && !connection?.saveData;
  const draw = (seconds: number) => {
    context.clearRect(0, 0, width, height); // Transparent: CSS owns exact #071724.
    elapsed += seconds;
    for (const star of stars) {
      advanceStar(star, seconds, width, height, Math.random);
      const point = projectStar(star, width, height);
      const alpha = point.alpha * (.87 + .13 * Math.sin(elapsed * 1.3 + star.phase));
      context.fillStyle = star.cyan ? `rgba(163,228,236,${alpha})` : `rgba(232,241,244,${alpha})`;
      if (star.z < .65 && seconds > 0) {
        const factor = .004 / (star.z + .004);
        const dx = (point.x - width * .68) * factor;
        const dy = (point.y - height * .43) * factor;
        const length = Math.hypot(dx, dy);
        const limit = width <= 700 ? 5 : 8;
        const scale = length > limit ? limit / length : 1;
        context.beginPath();
        context.moveTo(point.x - dx * scale, point.y - dy * scale);
        context.lineTo(point.x, point.y);
        context.lineWidth = Math.max(.5, point.radius * .65);
        context.strokeStyle = `rgba(163,228,236,${alpha * .36})`;
        context.stroke();
      }
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    }
    host.dataset.starfieldReady = '';
  };
  const tick = (now: number) => {
    frame = 0;
    if (!allowed()) return;
    frame = requestAnimationFrame(tick);
    if (now - previous < 1000 / 30) return;
    const seconds = Math.min((now - previous) / 1000, .05);
    previous = now;
    draw(seconds);
  };
  const update = () => {
    if (allowed() && width && height) {
      host.dataset.starfieldState = 'running';
      if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      host.dataset.starfieldState = 'paused';
      if (motion.matches || connection?.saveData) delete host.dataset.starfieldReady;
    }
  };
  const resize = () => {
    if (disposed) return;
    const bounds = host.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, width <= 700 ? 1.25 : 1.5, Math.sqrt(4_000_000 / (width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: starCount(width, height) }, () => createStar(Math.random, true));
    if (!motion.matches && !connection?.saveData) draw(0);
    update();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); update(); }, { threshold: .01 });
  const resizeObserver = new ResizeObserver(resize);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    stars.length = 0;
    observer.disconnect();
    resizeObserver.disconnect();
    motion.removeEventListener('change', update);
    connection?.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', update);
    document.removeEventListener('astro:before-swap', dispose);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    canvas.width = canvas.height = 0;
    delete host.dataset.starfieldReady;
    host.dataset.starfieldState = 'disposed';
  };
  // Retain only the bounded scene during BFCache suspension; no live RAF.
  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) { dispose(); return; }
    cancelAnimationFrame(frame); frame = 0;
    host.dataset.starfieldState = 'paused';
  };
  const onPageShow = () => update();
  motion.addEventListener('change', update);
  connection?.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('astro:before-swap', dispose, { once: true });
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  observer.observe(host);
  resizeObserver.observe(host);
  resize();
  return dispose;
}
