/** Progressive enhancement: the complete navigation stays usable without JS. */
export function initNavigation(): () => void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const button = header?.querySelector<HTMLButtonElement>('.menu-toggle');
  const nav = header?.querySelector<HTMLElement>('#primary-nav');
  if (!header || !button || !nav) return () => {};

  const mobile = window.matchMedia('(max-width: 700px)');
  const setOpen = (open: boolean, restoreFocus = false) => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.toggleAttribute('data-open', open);
    if (restoreFocus) button.focus();
  };
  const onButton = () => setOpen(button.getAttribute('aria-expanded') !== 'true');
  const onNav = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    setOpen(false);
    // Closing a mobile menu must not leave keyboard focus in its hidden subtree.
    if (mobile.matches) {
      const destination = document.getElementById(link.hash.slice(1));
      if (destination) {
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  };
  const onOutside = (event: PointerEvent) => {
    if (event.target instanceof Node && !header.contains(event.target)) setOpen(false);
  };
  const onBreakpoint = () => setOpen(false);

  header.classList.add('nav-enhanced');
  button.hidden = false;
  button.addEventListener('click', onButton);
  nav.addEventListener('click', onNav);
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onOutside);
  mobile.addEventListener('change', onBreakpoint);

  const cleanup = () => {
    button.removeEventListener('click', onButton);
    nav.removeEventListener('click', onNav);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onOutside);
    mobile.removeEventListener('change', onBreakpoint);
    document.removeEventListener('astro:before-swap', cleanup);
  };
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  return cleanup;
}
