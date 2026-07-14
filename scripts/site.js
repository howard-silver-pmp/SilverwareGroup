(() => {
  const mobileBreakpoint = 720;

  document.querySelectorAll('.nav').forEach((nav) => {
    const toggle = nav.querySelector('.nav-toggle');
    const menu = nav.querySelector('.nav-links');

    if (!toggle || !menu) return;

    const setMenuState = (isOpen) => {
      nav.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('.sr-only').textContent = isOpen
        ? 'Close navigation menu'
        : 'Open navigation menu';
    };

    toggle.addEventListener('click', () => {
      setMenuState(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a') && window.innerWidth <= mobileBreakpoint) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenuState(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && toggle.getAttribute('aria-expanded') === 'true') {
        setMenuState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > mobileBreakpoint) {
        setMenuState(false);
      }
    });
  });
})();
