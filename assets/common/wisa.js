/* =====================================================================
   WISA 마케팅 시안 공통 스크립트 (patch-172 · 2026-11-07)
   · GEO · 온사이트에 똑같이 들어 있던 독립 블록을 그대로 옮긴 파일 (각 블록은 서로 의존 없음)
   · 각 페이지 </body> 바로 위, 페이지 스크립트 다음에 불러옴
   · 이 파일을 고치면 쓰는 모든 페이지의 <script src="... wisa.js?v=NNN"> 숫자를 새 patch 번호로 올림
   ===================================================================== */

/* @region vw-enter (patch-77 A): 진단·해결·점검 비주얼 등장 애니메이션 */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const wins = document.querySelectorAll('.sr-vis.vw'); if (!wins.length) return;
  const count = (el, to, dur) => { const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / dur); el.nodeValue = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
  wins.forEach(w => {
    w.classList.add('vw-pre', 'vw-anim');
    w.querySelectorAll('.vw-cl').forEach((el, i) => el.style.setProperty('--n', i));
    w.querySelectorAll('.vw-qs li').forEach((el, i) => el.style.setProperty('--n', i));
    w.querySelectorAll('.vw-qs em').forEach((el, i) => el.style.setProperty('--n', i));
  });
  void document.body.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => wins.forEach(w => w.classList.remove('vw-pre'))));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const w = e.target; io.unobserve(w);
    w.classList.add('vw-go');
    const sc = w.querySelector('.vw-sc strong'); const tn = sc && sc.firstChild;
    if (tn && tn.nodeType === 3) { const v = parseInt(tn.nodeValue, 10); if (v) { tn.nodeValue = '0'; count(tn, v, 1200); } }
  }), { threshold: .4 });
  wins.forEach(w => io.observe(w));
})();
/* @endregion */

/* @region st2-code (patch-82 A): STEP 2 코드가 다듬어지는 애니메이션 (보일 때마다 재생) */
(() => {
  const win = document.querySelector('#geo-how .st2'); if (!win) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const pre = win.querySelector('.code'), chip = win.querySelector('.vw-chip, .st2-stat'); if (!pre || !chip) return;
  const kv = (k, v, num, comma) => [['', '  '], ['k', '"' + k + '"'], ['', ': '], [num ? 'n' : 'v', num ? v : '"' + v + '"'], ['', comma ? ',' : '']];
  const html = (segs, n) => { let out = '', left = n == null ? 1e9 : n;
    for (const [c, t] of segs) { if (left <= 0) break; const piece = t.slice(0, left); left -= piece.length; out += c ? '<span class="' + c + '">' + piece + '</span>' : piece; } return out; };
  const len = segs => segs.reduce((a, [, t]) => a + t.length, 0);
  const adds = [['size', '50ml'], ['ingredient', '세라마이드'], ['skinType', '건성 · 민감성'], ['reviewCount', '1284', true]];
  let T = []; const later = (fn, ms) => new Promise(r => T.push(setTimeout(() => { fn && fn(); r(); }, ms)));
  let run = 0;
  const line = (segs, cls) => { const el = document.createElement('span'); el.className = 'cl' + (cls ? ' ' + cls : ''); el.innerHTML = html(segs); return el; };
  let L = {};
  const reset = () => { run++; T.forEach(clearTimeout); T = []; pre.classList.remove('done'); pre.innerHTML = '';
    chip.textContent = '정리 중'; chip.classList.add('wip');
    L.open = line([['p', '{']]); L.type = line(kv('@type', 'Product', false, true)); L.name = line(kv('name', '수분크림', false, false)); L.close = line([['p', '}']]);
    [L.open, L.type, L.name, L.close].forEach(el => pre.appendChild(el)); };
  const typeTo = async (el, segs, from, to, ms, id) => { const step = from <= to ? 1 : -1;
    for (let n = from; step > 0 ? n <= to : n >= to; n += step) { if (id !== run) return false; el.innerHTML = html(segs, n); await later(null, ms); } return true; };
  const play = async () => { reset(); const id = run;
    await later(null, 700); if (id !== run) return;
    // 1) 상품명 다듬기: "수분크림" → "세라마이드 수분크림"
    L.name.classList.add('chg', 'cur');
    const before = kv('name', '수분크림', false, false), base = len(kv('name', '', false, false)) - 1;
    if (!await typeTo(L.name, before, len(before), base, 55, id)) return;
    const after = kv('name', '세라마이드 수분크림', false, true);
    L.name.innerHTML = html(after, base);
    if (!await typeTo(L.name, after, base, len(after), 45, id)) return;
    L.name.classList.remove('cur');
    // 2) 빠진 정보 한 줄씩 추가
    for (let i = 0; i < adds.length; i++) { const [k, v, num] = adds[i]; const segs = kv(k, v, num, i < adds.length - 1);
      const el = line([], 'add cur'); pre.insertBefore(el, L.close);
      if (!await typeTo(el, segs, 0, len(segs), 26, id)) return; el.classList.remove('cur'); await later(null, 140); if (id !== run) return; }
    // 3) 완료: 하이라이트 빠지고 배지 '적용 완료'
    await later(null, 500); if (id !== run) return;
    pre.classList.add('done'); chip.textContent = '적용 완료'; chip.classList.remove('wip');
  };
  reset();
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) play(); else reset(); }), { threshold: .5 }).observe(win);
})();
/* @endregion */

/* @region geo-chat-typing (patch-73 B): 비교 GEO 창 질문 → 답변 타이핑 (보일 때마다 재생) */
(() => {
  const win = document.querySelector('#geo-why .pn.chat'); if (!win) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ans = win.querySelector('.ans'), p = ans && ans.querySelector('p'); if (!p) return;
  const nodes = []; const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) nodes.push({ n: tw.currentNode, t: tw.currentNode.nodeValue });
  const dots = document.createElement('div'); dots.className = 'typing'; dots.innerHTML = '<i></i><i></i><i></i>'; ans.before(dots);
  let T = [];
  const later = (fn, ms) => T.push(setTimeout(fn, ms));
  const reset = () => { T.forEach(clearTimeout); T = []; win.classList.add('tw'); win.classList.remove('q-on', 'typing-on', 's-on'); p.classList.remove('typing-now');
    nodes.forEach(o => { o.n.nodeValue = ''; if (o.n.parentElement !== p) o.n.parentElement.classList.add('tw-h'); }); };
  const type = (i, j) => {
    if (i >= nodes.length) { p.classList.remove('typing-now'); later(() => win.classList.add('s-on'), 250); return; }
    const o = nodes[i]; if (j === 0 && o.n.parentElement !== p) o.n.parentElement.classList.remove('tw-h');
    if (j >= o.t.length) { o.n.nodeValue = o.t; type(i + 1, 0); return; }
    o.n.nodeValue = o.t.slice(0, j); later(() => type(i, j + 2), 30);
  };
  const play = () => { reset();
    later(() => win.classList.add('q-on'), 300);
    later(() => win.classList.add('typing-on'), 1000);
    later(() => { win.classList.remove('typing-on'); p.classList.add('typing-now'); type(0, 0); }, 2100);
  };
  reset();
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) play(); else reset(); }), { threshold: .5 }).observe(win);
})();
/* @endregion */

/* @region version-history (patch-92): 시안 히스토리 패널 */
(() => {
  const root = document.getElementById('vh'); if (!root) return;
  let items = []; try { items = JSON.parse(root.dataset.items); } catch (e) { return; }
  const list = root.querySelector('.vh-list'), btn = root.querySelector('.vh-btn');
  items.forEach(it => { const li = document.createElement('li'); if (it.current) li.className = 'cur';
    const t = document.createElement('time'); t.textContent = it.date; li.appendChild(t);
    if (it.current) { const sp = document.createElement('span'); sp.className = 'vh-now'; sp.textContent = it.name; const i = document.createElement('i'); i.textContent = '현재 시안'; sp.appendChild(i); li.appendChild(sp); }
    else { const a = document.createElement('a'); a.href = it.url; if (/^https?:/.test(it.url)) { a.target = '_blank'; a.rel = 'noopener'; } a.textContent = it.name; li.appendChild(a); } /* patch-163 저장소 안 시안(웹 주소)은 같은 창에서 전환, 아티팩트는 새 탭 */
    list.appendChild(li); });
  btn.querySelector('em').textContent = items.length;
  const set = o => { root.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!root.classList.contains('open')); });
  document.addEventListener('click', e => { if (!root.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();
/* @endregion */

/* @region report-zoom (p2) [수정] P3: PC 1024~1439 리포트 대시보드 비율 축소 배율 = 들어갈 폭 ÷ 1240 */
(() => {
  const rp = document.querySelector("#geo-report .rp-duo > .rp"); if (!rp) return;
  const mq = matchMedia("(min-width: 1024px) and (max-width: 1439px)");
  const fit = () => rp.style.setProperty("--rpz", mq.matches ? (rp.parentElement.clientWidth / 1240).toFixed(4) : 1);
  fit(); addEventListener("resize", fit);
})();
/* @endregion */

/* @region tab-ind (patch-173): 히어로 탭 선택 표시(알약)를 옆 탭으로 미끄러뜨린 뒤 이동 (CSS wisa.css tab-ind) */
(() => {
  const nav = document.querySelector('.tab-page'); if (!nav) return;
  const place = a => { nav.style.setProperty('--ix', a.offsetLeft + 'px'); nav.style.setProperty('--iy', a.offsetTop + 'px'); nav.style.setProperty('--iw', a.offsetWidth + 'px'); nav.style.setProperty('--ih', a.offsetHeight + 'px'); };
  const cur = () => nav.querySelector('a.on');
  if (!cur()) return;
  place(cur()); nav.classList.add('ind');
  setTimeout(() => nav.classList.add('ready'), 60);   // 첫 위치는 움직임 없이
  addEventListener('resize', () => cur() && place(cur()));
  if (document.fonts) document.fonts.ready.then(() => cur() && place(cur()));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  nav.addEventListener('click', e => {
    const a = e.target.closest('a'); const on = cur();
    if (!a || a === on || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.origin !== location.origin) return;
    e.preventDefault();
    const dot = on.querySelector('i');
    on.classList.remove('on'); on.removeAttribute('aria-current');
    a.classList.add('on'); a.setAttribute('aria-current', 'page'); if (dot) a.prepend(dot);
    place(a);
    setTimeout(() => { location.href = a.href; }, reduced ? 0 : 300);
  });
})();
/* @endregion */
