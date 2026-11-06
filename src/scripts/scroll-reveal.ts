/** Visible-by-default progressive enhancement; one owner, <=24 targets/animations. */
export function initScrollReveal(root: ParentNode = document): () => void {
  if (typeof IntersectionObserver === 'undefined' || typeof Element.prototype.animate !== 'function') return () => {};
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
  const pending = new Set(Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    .filter((element) => element.dataset.revealed !== 'true').slice(0, 24));
  const active = new Set<Animation>();
  let observer: IntersectionObserver | undefined;
  let disposed = false;
  let suspended = false;

  const allowed = () => !disposed && !suspended && !document.hidden && !motion.matches && !connection?.saveData;
  const stop = () => {
    observer?.disconnect();
    observer = undefined;
    for (const animation of active) animation.cancel();
    active.clear();
  };
  const connect = () => {
    if (!allowed() || observer || !pending.size) return;
    try {
      observer = new IntersectionObserver((entries) => {
        if (!allowed()) return;
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (!entry.isIntersecting || !pending.has(element)) continue;
          observer?.unobserve(element);
          pending.delete(element);
          element.dataset.revealed = 'true';
          try {
            const animation = element.animate([
              { opacity: .3, transform: 'translate3d(0, 22px, 0)' },
              { opacity: 1, transform: 'translate3d(0, 0, 0)' },
            ], { duration: 650, delay: Math.min(160, Math.max(0, Number(element.dataset.revealDelay) || 0)),
              easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
            active.add(animation);
            animation.onfinish = () => { active.delete(animation); animation.cancel(); };
            animation.oncancel = () => { active.delete(animation); };
          } catch {
            // Unsupported/failed decorative animation leaves ordinary visible DOM.
            continue;
          }
        }
        if (!pending.size) { observer?.disconnect(); observer = undefined; }
      }, { threshold: 0, rootMargin: '0px 0px 32px 0px' });
      for (const element of pending) observer.observe(element);
    } catch {
      // Observer setup is optional; no style ever hides content awaiting it.
      stop();
    }
  };
  const update = () => { if (allowed()) connect(); else stop(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop();
    pending.clear();
    motion.removeEventListener('change', update);
    connection?.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', update);
    document.removeEventListener('astro:before-swap', dispose);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
  };
  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) { dispose(); return; }
    suspended = true;
    stop();
  };
  const onPageShow = () => { suspended = false; update(); };
  motion.addEventListener('change', update);
  connection?.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('astro:before-swap', dispose, { once: true });
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  connect();
  return dispose;
}
