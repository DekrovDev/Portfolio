/* Small, finite interactions; no per-frame pointer work or layout movement. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = '.btn-primary, .btn-secondary, .project-link, .back-link, .lang-btn, .menu-toggle, .accordion-copy-btn, .net-btn, .wave-control';
  const pulse = target => {
    if (reduced.matches || !(target instanceof Element)) return;
    const control = target.closest(controls);
    if (!control) return;
    control.querySelector('.perimeter-pulse')?.remove();
    const { width, height } = control.getBoundingClientRect();
    if (!width || !height) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'perimeter-pulse');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const rect = document.createElementNS(ns, 'rect');
    for (const [key, value] of Object.entries({ x: .75, y: .75, width: Math.max(0, width - 1.5), height: Math.max(0, height - 1.5), rx: 1.5, pathLength: 100 })) {
      rect.setAttribute(key, value);
    }
    svg.append(rect);
    control.append(svg);
    rect.addEventListener('animationend', () => svg.remove(), { once: true });
    // Cleanup also covers navigation, preference changes, or interrupted animation.
    setTimeout(() => svg.remove(), 750);
  };
  document.addEventListener('pointerdown', event => { if (event.button === 0) pulse(event.target); }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.repeat || !(event.target instanceof Element)) return;
    if (event.key === 'Enter' || (event.key === ' ' && event.target.closest('button'))) pulse(event.target);
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    document.querySelectorAll('.perimeter-pulse').forEach(svg => svg.remove());
  });
})();
