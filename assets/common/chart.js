/* WISA 그래프 공통 부품 (patch-406) — .gx-anim 이 화면에 들어오면 .gx-go 를 붙여 막대 · 도넛이 차오름 · 부품 순서 --k 자동 (docs/graph.html "그래프 부품") */
(() => {
  const els = document.querySelectorAll('.gx-anim');
  document.querySelectorAll('.gx-hbar, .gx-vbar, .gx-funnel').forEach(l => [...l.children].forEach((li, k) => li.style.setProperty('--k', k)));
  document.querySelectorAll('.gx-donut').forEach(d => d.querySelectorAll('.s').forEach((s, k) => s.style.setProperty('--k', k)));
  if (!els.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('gx-go')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('gx-go'); io.unobserve(e.target); } }), { threshold: .3 });
  els.forEach(e => io.observe(e));
})();
