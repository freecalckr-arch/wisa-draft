/* WISA 호스팅 상세 공통 스크립트 (patch-731)
   웹호스팅 · 서버호스팅 · 프라이빗 클라우드 · 퍼블릭 클라우드 · CDN · 클라우드플레어 6페이지가 똑같이 쓰는 스크립트.
   푸터 · 상담 레이어 다음(예전 인라인 메인 스크립트 자리)에서 불러옴 · wisa.js 보다 먼저.
   ① 메인 (헤더 · 등장 · 스냅 등)  ② host-tabs  ③ ht-scroll */

/* =====================================================================
   WISA 리뉴얼 2026 · 메인 (v2 최종) — 스크립트
   하나의 즉시 실행 함수 안에서 영역별로 나뉘어 있음 (@region ~ @endregion)
   실행 순서: common → hero → malltype → reveal → portfolio → solution → header → snap → footer
   영역 사이에 공유하는 값: ASSET · reduced · finePointer · isMo(히어로) · HDR · pcMode(reveal) · brMo(포트폴리오) · revealCheck
   섹션 이벤트: 각 섹션 요소에 'sec:on' / 'sec:off' (reveal이 보냄)
   ===================================================================== */
(() => {
  /* @region common
     공통 값
     - reduced: 동작 줄이기 설정이면 움직임을 끔 / finePointer: 마우스 사용 기기(패럴랙스·원스크롤 조건)
     - px(): 1920 시안 x좌표 → 화면 가운데 기준 위치
  */
  // 에셋 경로 (납품 폴더 assets/ 구조 그대로)
  const ASSET = { hero: 'assets/main/hero/', logo: 'assets/main/trust-logo/', mall: 'assets/main/malltype/', pf: 'assets/main/portfolio/' };
  const PF_FILE = {"a1":"main-portfolio-a1-tandy.jpg","a2":"main-portfolio-a2-krlee.jpg","a3":"main-portfolio-a3-pureal.jpg","a4":"main-portfolio-a4-esthermall.jpg","a5":"main-portfolio-a5-giordano.jpg","a6":"main-portfolio-a6-klairs.jpg","a7":"main-portfolio-a7-alyac.jpg","b0":"main-portfolio-b0.jpg","b1":"main-portfolio-b1-hemeko.jpg","b2":"main-portfolio-b2-ananti.jpg","b3":"main-portfolio-b3-blackyak.jpg","b4":"main-portfolio-b4-saengong.jpg","b5":"main-portfolio-b5-list-shesmiss.jpg","b6":"main-portfolio-b6-andar.jpg","b7":"main-portfolio-b7-kora.jpg","c1":"main-portfolio-c1.jpg","c2":"main-portfolio-c2.jpg","c3":"main-portfolio-c3-xexymix.jpg","c4":"main-portfolio-c4-naaamyuuu.jpg","c5":"main-portfolio-c5-mycoach.jpg","c6":"main-portfolio-c6.jpg","c7":"main-portfolio-c7.jpg"};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const px = (x) => `calc(50% + ${x - 960}px)`; // 1920 시안 좌표 → 중앙 기준
  /* @endregion */





/* @region reveal
     서브 페이지 스크롤 페이드업 (원스크롤 없음)
     - 모든 기기 요소 단위: 화면 아래 10% 안쪽에 들어오면 .rv 등장, 화면 아래로 완전히 내려가면 초기화 (위로 지나간 요소는 유지)
     - .rv-mo: 모바일 전용 페이드업 (푸터 등)
     의존: 없음 (pcMode · revealCheck를 여기서 정의)
  */
  const pcMode = matchMedia('(min-width: 1024px)');
  const rvEls = [...document.querySelectorAll('main .rv')];
  const rvMo = [...document.querySelectorAll('.rv-mo')];
  var revealCheck = function () {
    rvEls.forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.top >= innerHeight) el.classList.remove('in');
      else if (b.top < innerHeight * .9) el.classList.add('in');
    });
    if (pcMode.matches) return;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    rvMo.forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.bottom <= 0 || b.top >= innerHeight) el.classList.remove('in');
      else if (atEnd || (b.top < innerHeight * .92 && b.bottom > innerHeight * .08)) el.classList.add('in');
    });
  };
  addEventListener('scroll', revealCheck, { passive: true });
  addEventListener('resize', revealCheck);
  requestAnimationFrame(revealCheck);
  /* @endregion */

  /* @region geo-url
     URL 진단 신청: 비었거나 주소 형식이 아니면 안내 · 맞으면 상담 페이지로 (시안: 안내 문구만 표시)
     - http(s):// 없이 입력해도 받아줌
  */
  const urlForm = document.getElementById('geoUrlForm');
  if (urlForm) {
    const input = urlForm.querySelector('input'), msg = document.getElementById('geoUrlMsg');
    const setMsg = (t, err) => { msg.textContent = t; msg.style.color = err ? '' : 'var(--gray-700)'; urlForm.classList.toggle('err', !!err); };
    input.addEventListener('input', () => { if (urlForm.classList.contains('err')) setMsg(''); });
    urlForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) { setMsg('진단할 쇼핑몰 주소를 입력해 주세요.', true); input.focus(); return; }
      let ok = false;
      try { const u = new URL(/^https?:\/\//i.test(v) ? v : 'https://' + v); ok = /\.[a-z가-힣]{2,}$/i.test(u.hostname); } catch (_) {}
      if (!ok) { setMsg('주소 형식을 확인해 주세요. 예) https://내쇼핑몰.co.kr', true); input.focus(); return; }
      setMsg('상담 신청 페이지로 이동합니다. (입력한 주소가 함께 전달됩니다)');
    });
  }
  /* @endregion */

  /* @region geo-tabs
     진단 · 해결 · 점검 탭 (탭 라인)
     - 누르면 제목 · 설명 · 카드를 같은 키(data-dx)로 전환 · 제목은 아래에서 올라오며 교체(이전 제목은 위로 빠짐)
     - 화면에 보이는 동안 2초마다 자동 전환 · 마우스를 올리거나 포커스가 있으면 멈춤 · 탭을 직접 누르면 자동 전환 끝
  */
  const dx = document.getElementById('geo-diagnosis');
  if (dx && dx.querySelector('.dx-nav')) {   // 탭 구조일 때만 (세로 배열이면 건너뜀)
    const keys = [...dx.querySelectorAll('.dx-nav [data-dx]')].map(b => b.dataset.dx);
    let cur = keys[0], auto = !reduced, hold = false, seen = false;
    const show = k => {
      if (k === cur) return;
      const prev = dx.querySelector('.dx-titles .on'), next = dx.querySelector('.dx-titles [data-dx="' + k + '"]');
      // 다음 제목을 아래 위치로 되돌린 뒤 들어오게
      next.style.transition = 'none'; next.classList.remove('out'); void next.offsetWidth; next.style.transition = '';
      prev.classList.remove('on'); prev.classList.add('out'); next.classList.add('on');
      dx.querySelectorAll('.dx-nav [data-dx], .dx-panel').forEach(el => {
        const on = el.dataset.dx === k; el.classList.toggle('on', on);
        if (el.tagName === 'BUTTON') el.setAttribute('aria-selected', String(on));
      });
      cur = k;
    };
    dx.querySelector('.dx-nav').addEventListener('click', e => { const b = e.target.closest('[data-dx]'); if (!b) return; auto = false; show(b.dataset.dx); });
    dx.addEventListener('mouseenter', () => hold = true); dx.addEventListener('mouseleave', () => hold = false);
    dx.addEventListener('focusin', () => hold = true); dx.addEventListener('focusout', () => hold = false);
    new IntersectionObserver(es => es.forEach(en => seen = en.isIntersecting), { threshold: .35 }).observe(dx);
    setInterval(() => { if (auto && seen && !hold && !document.hidden) show(keys[(keys.indexOf(cur) + 1) % keys.length]); }, 2000);
  }
  /* @endregion */

  /* @region geo-hero-ai
     히어로 — 제목 속 AI 이름 롤링(2.4초) · 뷰티 답변 첫 진입 시 1회 타이핑
  */
  const roll = document.querySelector('.ai-roll');
  if (roll) {
    // 항상 아래에서 위로 올라오도록: 첫 항목 복제본을 끝에 붙이고, 복제본까지 올라간 뒤 순간 처음으로 되돌림
    const inn = roll.querySelector('.ai-roll-in'), n = inn.children.length;
    const clone = inn.children[0].cloneNode(true); clone.setAttribute('aria-hidden', 'true'); inn.appendChild(clone);
    const items = [...inn.children]; let ri = 0;
    const fit = () => { roll.style.width = items[ri].scrollWidth + 'px'; inn.style.transform = 'translateY(' + (-ri * 1.3) + 'em)'; };
    fit(); if (document.fonts) document.fonts.ready.then(fit);
    if (!reduced) setInterval(() => {
      ri += 1; fit();
      if (ri === n) setTimeout(() => { inn.style.transition = 'none'; ri = 0; fit(); void inn.offsetHeight; inn.style.transition = ''; }, 650);
    }, 2400);
  }
  // 시장 변화 그래프: 화면에 들어오면 선이 왼쪽에서 오른쪽으로 그려지고 교차 시점이 나타남 (1회)
  const mkChart = document.querySelector('.mk-chart');
  if (mkChart && !reduced && 'IntersectionObserver' in window) {
    mkChart.classList.add('mk-anim');
    const io2 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io2.disconnect(); mkChart.classList.add('on'); } }, { threshold: .45 });
    io2.observe(mkChart);
  }
  // 시장 변화 수치: 화면에 들어오면 0부터 카운트 업 (1회)
  const mkStats = document.querySelector('.mk-stats');
  if (mkStats && !reduced && 'IntersectionObserver' in window) {
    const nums = [...mkStats.querySelectorAll('strong[data-to]')];
    const setN = (el, v) => { el.firstChild.nodeValue = String(v); };
    nums.forEach(el => setN(el, (0).toFixed((el.dataset.to.split('.')[1] || '').length)));
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        nums.forEach(el => { const d = (el.dataset.to.split('.')[1] || '').length; setN(el, (+el.dataset.to * e).toFixed(d)); });   /* patch-312: 소수점 자리 유지 */
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .4 });
    io.observe(mkStats);
  }
  // sf-hero (patch-333): 제목 롤링 채널(네이버쇼핑 · 카카오쇼핑 · 구글쇼핑)에 맞춰 가운데 검색 결과 화면 · 알림 아이콘 교체 (롤링 2.4초와 같은 박자)
  const sfRoll = document.querySelector('#geo-hero .ai-roll-in'), sfSc = [...document.querySelectorAll('#geo-hero .sn-sc')], sfTl = document.querySelector('#geo-hero .sn-tl');
  if (sfRoll && sfSc.length) {
    const LG = ['naver', 'kakao', 'google'];
    const sync = () => { const m = /translateY\((-?[\d.]+)em\)/.exec(sfRoll.style.transform || ''); const i = m ? Math.round(-parseFloat(m[1]) / 1.3) % sfSc.length : 0; sfSc.forEach((e, k) => e.classList.toggle('on', k === i)); if (sfTl) sfTl.src = 'assets/common/brand/' + LG[i] + '.svg'; };
    new MutationObserver(sync).observe(sfRoll, { attributes: true, attributeFilter: ['style'] }); sync();
  }
  // 리포트: 화면에 들어오면 그래프 등장 + 카드 숫자 카운트업 (1회)
  const rpEl = document.querySelector('#geo-report .rp');
  if (rpEl) {
    const nums = [...rpEl.querySelectorAll('.np-kpi strong, .db-top strong, .dn-v')].map(el => {
      const tn = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue));
      return tn ? { tn, to: +tn.nodeValue.replace(/[^\d.]/g, ''), comma: tn.nodeValue.includes(',') } : null;
    }).filter(Boolean);
    const fmt = (v, c) => c ? Math.round(v).toLocaleString('ko-KR') : String(Math.round(v));
    if (reduced || !('IntersectionObserver' in window)) rpEl.classList.add('go');
    else {
      nums.forEach(n => n.tn.nodeValue = fmt(0, n.comma));
      const io3 = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        io3.disconnect(); rpEl.classList.add('go');
        const t0 = performance.now(), dur = 1300;
        const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); nums.forEach(n => n.tn.nodeValue = fmt(n.to * e, n.comma)); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }, { threshold: .25 });
      io3.observe(rpEl);
    }
  }
  /* @endregion */





  /* @region header
     GNB
     - 모바일: 로고 줄은 스크롤로 올라가고 메뉴 줄만 상단 고정 → 메뉴 줄 위치(--gnb-offset)를 계산
     - 스크롤 이벤트 누락 대비로 rAF에서 스크롤 변화를 감지해 reveal 판정 실행
  */
  const header = document.querySelector('.header');
  let gnbTarget = null; // 스냅 이동 중 도착 위치(scrollY)
  // 모바일·태블릿 메뉴 고정 위치: 헤더 안에서 메뉴 줄이 시작하는 지점만큼 위로 올림
  const gnbEl = header.querySelector('.gnb');
  const setGnbOffset = () => header.style.setProperty('--gnb-offset', (matchMedia('(max-width: 767px)').matches ? gnbEl.offsetTop : 0) + 'px');
  // 모바일 상단 배너: 높이를 --banner-h로 알려 첫 화면 높이를 맞추고, 닫으면 제거
  const moBanner = document.getElementById('moBanner');
  const setBannerH = () => document.documentElement.style.setProperty('--banner-h', (moBanner && moBanner.isConnected && moBanner.offsetHeight) ? moBanner.offsetHeight + 'px' : '0px');
  setBannerH(); addEventListener('resize', setBannerH);
  document.getElementById('moBannerClose').addEventListener('click', () => { moBanner.remove(); setBannerH(); setGnbOffset(); dispatchEvent(new Event('resize')); });
  setGnbOffset(); addEventListener('resize', setGnbOffset);
  if (document.fonts) document.fonts.ready.then(setGnbOffset);
  function gnbTone() { header.classList.remove('dark'); } // v2: 검정 배경 섹션 없음
  // GNB 2depth: PC·태블릿은 마우스 올림/포커스로 열고 헤더를 벗어나면 닫음 · 모바일은 탭으로 열고 닫음
  const d2Btns = [...header.querySelectorAll('.gnb button[data-menu]')];
  const d2Panels = [...header.querySelectorAll('.depth2')];
  const moPanel = header.querySelector('.mo-panel');
  const moMenu = matchMedia('(max-width: 767px)');
  let d2Close = 0;
  const openMenu = key => {
    clearTimeout(d2Close);
    d2Btns.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.menu === key)));
    d2Panels.forEach(p => p.classList.toggle('open', !moMenu.matches && p.dataset.menu === key));
    moPanel.querySelectorAll('.mp-body').forEach(b => b.classList.toggle('on', b.dataset.menu === key));
    moPanel.classList.toggle('open', moMenu.matches && !!key);
    document.body.classList.toggle('mo-menu-open', moMenu.matches && !!key); // 모바일 메뉴가 열려 있는 동안 제작상담 버튼 숨김
  };
  d2Btns.forEach(b => {
    b.addEventListener('mouseenter', () => { if (!moMenu.matches) openMenu(b.dataset.menu); });
    b.addEventListener('focus', () => { if (!moMenu.matches) openMenu(b.dataset.menu); });
    b.addEventListener('click', () => openMenu(b.getAttribute('aria-expanded') === 'true' ? null : b.dataset.menu));
  });
  header.querySelectorAll('.gnb a').forEach(a => a.addEventListener('mouseenter', () => { if (!moMenu.matches) openMenu(null); }));
  header.addEventListener('mouseleave', () => { if (!moMenu.matches) d2Close = setTimeout(() => openMenu(null), 120); });
  header.addEventListener('mouseenter', () => clearTimeout(d2Close));
  header.addEventListener('focusout', e => { if (!header.contains(e.relatedTarget)) openMenu(null); });
  moPanel.addEventListener('click', e => { if (e.target === moPanel) openMenu(null); });
  addEventListener('keydown', e => { if (e.key === 'Escape') openMenu(null); });
  addEventListener('scroll', () => { if (!moMenu.matches) openMenu(null); }, { passive: true }); // PC: 스크롤하면 닫음
  moMenu.addEventListener('change', () => openMenu(null));
  let lastScrollY = -1;
  (function tick() {
    if (scrollY !== lastScrollY) { lastScrollY = scrollY; revealCheck(); } // 스크롤 이벤트 누락 대비
    requestAnimationFrame(tick);
  })();
  /* @endregion */



  // 우측 플로팅: 맨 위 · 맨 아래 이동 (조금 스크롤하면 나타남 · 끝에서는 해당 버튼 비활성)
  const pnav = document.querySelector('.page-nav');
  if (pnav) {
    const [bUp, bDn] = pnav.querySelectorAll('button');
    const upd = () => { const y = scrollY, max = document.documentElement.scrollHeight - innerHeight; pnav.classList.toggle('on', y > 200); bUp.disabled = y < 4; bDn.disabled = y > max - 4; };
    pnav.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b) return; scrollTo({ top: b.dataset.go === 'top' ? 0 : document.documentElement.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); });
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }
  // 진단·해결·점검 진행 라인: 화면 55% 지점을 기준으로 라인이 차오르고, 지나간 번호 원이 켜짐 (위로 스크롤하면 되돌아감)
  const srRows = [];   // patch-290: 해결 번호 · 라인은 공통 wisa.js sr-line 에서
  if (srRows.length) {
    const srUpd = () => {
      const th = reduced ? Infinity : innerHeight * .55;
      srRows.forEach(row => {
        const r = row.getBoundingClientRect(), no = row.querySelector('.sr-no');
        no.classList.toggle('on', r.top + no.offsetHeight / 2 < th);
        const nh = no.offsetHeight, t = r.top + nh + 12, h = Math.max(1, r.height - nh - 24);
        row.style.setProperty('--p', Math.min(1, Math.max(0, (th - t) / h)).toFixed(3));
      });
    };
    addEventListener('scroll', srUpd, { passive: true }); addEventListener('resize', srUpd); srUpd();
  }
  /* @region geo-report-loop
     리포트 대시보드: 시작 애니메이션이 끝난 뒤 은은하게 반복
     ① 지표 숫자(크롤러 방문 · AI 검색 유입)가 몇 초마다 1~3씩 오르고 '+n' 표시
     ② 그래프 최신 지점(일별 막대 마지막 · 월별 추이 마지막 점)에 파동 링
     ③ 도넛 조각을 차례로 강조 (범례 함께)
     움직임 줄이기 설정이면 실행하지 않음
  */
  const rpLoop = document.querySelector('#geo-report .rp');
  if (rpLoop && !reduced && 'IntersectionObserver' in window) {
    const NS = 'http://www.w3.org/2000/svg';
    const startLoops = () => {
      // ① 지표 숫자
      const kpis = [...rpLoop.querySelectorAll('.np-kpi.db6 li')].filter(li => /크롤러 방문|AI 검색 유입/.test(li.textContent));
      let ki = 0;
      setInterval(() => {
        if (document.hidden || !kpis.length) return;
        const li = kpis[ki++ % kpis.length], st = li.querySelector('strong');
        const tn = [...st.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!tn) return;
        const add = 1 + Math.floor(Math.random() * 3), v = +tn.nodeValue.replace(/[^\d]/g, '') + add;
        tn.nodeValue = v.toLocaleString('ko-KR');
        const t = document.createElement('span'); t.className = 'rp-tick'; t.textContent = '+' + add; li.appendChild(t);
        st.classList.remove('rp-bump'); void st.offsetWidth; st.classList.add('rp-bump');
        setTimeout(() => t.remove(), 1400);
      }, 3200);
      // ② 최신 지점 파동 링
      rpLoop.querySelectorAll('.db-svg').forEach(svg => {
        const bars = svg.querySelectorAll('.bar');
        if (bars.length) { bars[bars.length - 1].classList.add('rp-live-bar'); return; }
        const pt = svg.querySelector('.pt.last'); if (!pt) return;
        const ring = document.createElementNS(NS, 'circle');
        ring.setAttribute('cx', pt.getAttribute('cx')); ring.setAttribute('cy', pt.getAttribute('cy')); ring.setAttribute('r', '5'); ring.setAttribute('class', 'rp-ring');
        pt.parentNode.insertBefore(ring, pt);
      });
      // ③ 도넛 조각 차례로 강조
      const segs = [...rpLoop.querySelectorAll('.dn circle')], legs = [...rpLoop.querySelectorAll('.dn-lg li')];
      let di = 0;
      if (segs.length) setInterval(() => {
        if (document.hidden) return;
        segs.forEach((c, i) => c.classList.toggle('rp-hot', i === di)); legs.forEach((l, i) => l.classList.toggle('rp-hot', i === di));
        di = (di + 1) % segs.length;
      }, 2000);
    };
    const ioLoop = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { ioLoop.disconnect(); setTimeout(startLoops, 2600); } }, { threshold: .25 });
    ioLoop.observe(rpLoop);
  }
  /* @endregion */

  /* @region footer
     푸터 메뉴 아코디언
     - 태블릿·모바일에서만 동작 (PC는 4단 펼침) · 여러 개 동시에 열림
     의존: reveal(pcMode)
  */
  // 푸터 메뉴 아코디언 (모바일·태블릿)
  document.querySelectorAll('.ft-toggle').forEach(btn => btn.addEventListener('click', () => {
    if (pcMode.matches) return;
    const col = btn.closest('.ft-col'), open = !col.classList.contains('open');
    col.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
  }));
  /* @endregion */

})();

/* vw-enter → assets/common/wisa.js (patch-172) */



/* st2-code → assets/common/wisa.js (patch-172) */

/* geo-chat-typing → assets/common/wisa.js (patch-172) */

/* @region geo-scale (patch-164) 문제 · 단계 · 해결 화면 이미지: 칸 안쪽 폭 ÷ PC 가로 = 배율 --s (최대 1 · 확대 없음) */
(() => {
  const vs = [...document.querySelectorAll('#geo-why .bt-vis')].map(v => [v, 550])
    .concat([...document.querySelectorAll('#geo-how .bento.b3 .bt-vis')].map(v => [v, 360]))
    .concat([...document.querySelectorAll('#geo-diagnosis .sr-vis')].map(v => [v, 460]));
  if (!vs.length) return;
  const W = new Map(vs);
  const mq = matchMedia('(max-width: 1439px)');
  const set = v => {
    if (!mq.matches) { v.style.removeProperty('--s'); v.style.removeProperty('--cx'); return; }
    const cs = getComputedStyle(v), inner = v.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (inner <= 0) return;
    const sc = Math.min(1, inner / W.get(v));
    v.style.setProperty('--s', sc.toFixed(4));
    v.style.setProperty('--cx', Math.max(0, (v.clientWidth - W.get(v) * sc) / 2).toFixed(1) + 'px');   // 문제: 칸이 넓으면 가운데
  };
  const ro = new ResizeObserver(es => es.forEach(e => set(e.target)));
  vs.forEach(([v]) => { set(v); ro.observe(v); });
  mq.addEventListener('change', () => vs.forEach(([v]) => set(v)));
})();
/* @endregion geo-scale */

/* version-history → assets/common/wisa.js (patch-172) */


  /* @region host-tabs (patch-377): 모바일에서 현재 탭이 탭 줄 안에 보이게 가로 위치 맞춤 */
  (() => { const n = document.querySelector("#geo-hero .tab-page"), on = n && n.querySelector("a.on"); if (!on || n.scrollWidth <= n.clientWidth) return; n.scrollLeft = on.offsetLeft - (n.clientWidth - on.offsetWidth) / 2; })();
  /* @endregion host-tabs */


  /* @region ht-scroll (patch-598): 요금 · 사양 표 모바일(≤767) 스크롤 활성화 — 라이선스 비교 cmp-table-scroll 과 같은 방식 (화면 가운데에 가장 가까운 묶음 · 표가 화면 밖이면 모두 끔 · 동작 줄이기 시 없음) */
  (() => {
    const rows = [...document.querySelectorAll("#host-table .ht-g")];
    if (!rows.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mo = matchMedia("(max-width: 767px)"), box = rows[0].closest(".ht");
    let i = -1, raf = 0;
    const set = n => { if (n === i) return; rows.forEach((r, k) => r.classList.toggle("on", k === n)); i = n; };
    const pick = () => {
      raf = 0; if (!mo.matches) { set(-1); return; }
      const mid = innerHeight / 2, b = box.getBoundingClientRect();
      if (b.bottom < innerHeight * .25 || b.top > innerHeight * .75) { set(-1); return; }
      let best = 0, d = Infinity;
      rows.forEach((r, k) => { const q = r.getBoundingClientRect(), dd = Math.abs((q.top + q.bottom) / 2 - mid); if (dd < d) { d = dd; best = k; } });
      set(best);
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(pick); }, { passive: true });
    mo.addEventListener("change", pick);
    pick();
  })();
  /* @endregion ht-scroll */
