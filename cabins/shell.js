/* Static adapter for the approved shared NAMETY shell. */
(() => {
  'use strict';
  function mountShell() {
    const header = document.getElementById('site-header');
    const menu = document.getElementById('site-menu');
    const openButton = document.getElementById('site-menu-open');
    const closeButton = document.getElementById('site-menu-close');
    let savedOverflow = '';
    let returnFocus = null;
    let hasLock = false;
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 40);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    function restorePage() {
      openButton?.setAttribute('aria-expanded', 'false');
      if (hasLock) {
        document.body.style.overflow = savedOverflow;
        hasLock = false;
      }
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }
    function closeMenu() {
      if (menu?.open) menu.close();
    }
    openButton?.addEventListener('click', () => {
      if (!menu || menu.open) return;
      returnFocus = document.activeElement;
      savedOverflow = document.body.style.overflow;
      menu.showModal();
      document.body.style.overflow = 'hidden';
      hasLock = true;
      openButton.setAttribute('aria-expanded', 'true');
      closeButton?.focus({ preventScroll: true });
    });
    closeButton?.addEventListener('click', closeMenu);
    menu?.addEventListener('cancel', (event) => { event.preventDefault(); closeMenu(); });
    menu?.addEventListener('close', restorePage);
    menu?.addEventListener('click', (event) => { if (event.target.closest('a[href]')) closeMenu(); });
    ['(min-width: 992px)', '(min-width: 1200px)'].forEach((query) => {
      window.matchMedia(query).addEventListener('change', closeMenu);
    });
    document.querySelectorAll('[data-footer-year]').forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountShell, { once: true });
  else mountShell();
})();
