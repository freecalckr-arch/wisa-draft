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
    const t = document.createElement('time'); const dm = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(it.date || ''); t.textContent = dm ? it.date + ' (' + '일월화수목금토'[new Date(+dm[1], dm[2] - 1, +dm[3]).getDay()] + ')' : it.date; if (dm) t.dateTime = dm[1] + '-' + dm[2].padStart(2, '0') + '-' + dm[3].padStart(2, '0'); li.appendChild(t);   /* patch-212: 날짜 옆에 항상 요일 (data-items 에는 날짜만 · 요일은 자동 계산) */
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

/* @region rp-mo-tb (patch-200 · 공통 patch-201): 리포트 대시보드 모바일 축소 배율 --rpzm = 들어갈 폭 ÷ 700 (태블릿 배치 폭) */
(() => {
  const rp = document.querySelector("#geo-report .rp-duo > .rp"); if (!rp) return;
  const mq = matchMedia("(max-width: 767px)");
  const fit = () => rp.style.setProperty("--rpzm", mq.matches ? (rp.parentElement.clientWidth / 700).toFixed(4) : 1);
  fit(); addEventListener("resize", fit);
})();
/* @endregion */

/* @region mk-tb-fit (patch-205 · patch-206 PC · 태블릿 · 모바일 전체): 그래프 영역 그래프는 가로 유동 · 세로 고정
   · 보이는 그림(chart-pc · chart-tb · chart-mo)의 viewBox 가로를 실제 칸 폭으로 · 세로(PC · 태블릿 220 · 모바일 210 등 viewBox 높이)는 그대로 · 가로 좌표(x · x1 · x2 · cx · 선 경로)만 칸 폭 ÷ 원래 가로 배 · 글자 · 점 · 말풍선 크기는 그대로 (말풍선은 위치만 이동) */
(() => {
  const svgs = [...document.querySelectorAll("#geo-market svg.chart")]; if (!svgs.length) return;
  svgs.forEach(svg => {
    const vb = svg.getAttribute("viewBox").split(/\s+/).map(Number); svg._vb = vb;
    svg.querySelectorAll("*").forEach(el => { const o = {}; ["x", "x1", "x2", "cx", "width", "d"].forEach(a => { if (el.hasAttribute(a)) o[a] = el.getAttribute(a); }); el._o = o; });
  });
  const px = (d, k) => d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (m, x, y) => +(x * k).toFixed(1) + "," + y);
  const fit = () => svgs.forEach(svg => {
    const [, , BW, BH] = svg._vb, w = svg.getBoundingClientRect().width;
    if (!(w > 0)) return;   /* 지금 해상도에서 숨은 그림은 건너뜀 */
    const k = w / BW;
    svg.setAttribute("viewBox", "0 0 " + +(BW * k).toFixed(1) + " " + BH);
    svg.querySelectorAll("*").forEach(el => {
      const o = el._o; if (!o) return;
      const tip = el.closest(".tip2");
      if (tip) {   /* 말풍선: 크기 그대로 · 가운데만 비율 이동 */
        const r = tip.querySelector("rect"), c = +r._o.x + +r._o.width / 2, dx = c * (k - 1);
        if (o.x != null) el.setAttribute("x", +(+o.x + dx).toFixed(1));
        return;
      }
      if (el.tagName === "linearGradient" && el.getAttribute("gradientUnits") !== "userSpaceOnUse") return;
      ["x", "x1", "x2", "cx", "width"].forEach(a => { if (o[a] != null) el.setAttribute(a, +(o[a] * k).toFixed(1)); });
      if (o.d != null) el.setAttribute("d", px(o.d, k));
    });
  });
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

/* @region profile-shuffle (patch-178): 고객 프로필 실사 10장(assets/geo/profile/pt-01~10.jpg)을 페이지 열 때마다 섞어 배정
   · <img data-pf="번호" data-g="f|m"> → 같은 번호는 같은 사진, 다른 번호는 겹치지 않음 (성별별 5장씩)
   · 스크립트에서 쓸 때: wisaPf(번호, 'f'|'m') → 사진 경로 */
(() => {
  /* patch-216: <html data-pf-set="crm"> 페이지는 새 프로필 20장(assets/geo/crm-pf/cp-01~20 · 20~30대 · 그레이 배경 · 어깨까지 · 홀수 여성 · 짝수 남성) */
  const crm = document.documentElement.dataset.pfSet === "crm";
  const P = crm ? { f: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], m: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] } : { f: [1, 3, 6, 8, 9], m: [2, 4, 5, 7, 10] }, used = {}, n = { f: 0, m: 0 };
  for (const g in P) { const a = P[g]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } }
  window.wisaPf = (k, g = 'f') => {
    if (!(k in used)) used[k] = P[g][n[g]++ % P[g].length];
    return (crm ? 'assets/geo/crm-pf/cp-' : 'assets/geo/profile/pt-') + String(used[k]).padStart(2, '0') + '.jpg';
  };
  document.querySelectorAll('img[data-pf]').forEach(im => { im.src = wisaPf(im.dataset.pf, im.dataset.g); });
})();
/* @endregion */

/* @region hero-fit (patch-211): 히어로 비주얼 PC 최소(1024~1439) 축소 비율 --hz = min(1, 칸 폭 ÷ 1340) */
(() => {
  const q = matchMedia('(min-width: 1024px) and (max-width: 1439px)');
  document.querySelectorAll('#geo-hero .sh-visual').forEach(v => {
    const box = v.parentElement;
    const fit = () => { if (!q.matches) { v.style.removeProperty('--hz'); return; } const cs = getComputedStyle(box); const w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); v.style.setProperty('--hz', Math.min(1, w / 1340).toFixed(4)); };
    new ResizeObserver(fit).observe(box); q.addEventListener('change', fit); fit();
  });
})();
/* @endregion */
