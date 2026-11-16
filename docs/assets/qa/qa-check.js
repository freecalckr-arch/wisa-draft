/* WISA 개발 검수 스크립트 · 구현한 페이지를 시안 값과 자동 비교합니다.
   사용법 (docs/qa.html "자동 점검" 탭):
   1) 구현한 페이지에 아래 두 줄을 잠시 넣습니다 (검수 후 삭제).
        <script src="(경로)/qa/spec-geo.js"></script>   ← 페이지 이름에 맞는 시안 값 파일
        <script src="(경로)/qa/qa-check.js"></script>
   2) 브라우저 폭을 1440 · 1100 · 820 · 390 중 하나로 맞춥니다 (개발자 도구 기기 툴바).
      경계 폭(1920 · 1439 · 1024 · 1023 · 768 · 767 · 360)에서 돌리면 시안 비교 없이 기본 확인만 합니다.
   3) 콘솔에서  await WISAqa()  실행 → 화면 오른쪽에 결과 창이 뜨고, 항목을 누르면 그 요소로 이동합니다.
   기본 확인: 페이지 가로 넘침 · 깨진 이미지 · 불러오지 못한 폰트 · 남아 있는 시안 전용 코드.
   시안 비교: 영역(#geo-hero ~ #cta) 안 모든 요소의 글자(폰트 · 크기 · 굵기 · 줄 높이 · 자간 · 색 · 숫자 고정폭) · 모양(여백 · 테두리 · 모서리 · 바탕 · 그림자 · 정렬) ·
   크기(가로 · 세로 · 영역 안 가로 위치) · 숨김 여부 · 애니메이션(이름 · 시간 · 반복) · 동작 줄이기 규칙 · 호버 · 스크립트 움직임(바뀌는 간격 포함).
   요소는 "영역 id + 태그 + 클래스 + 같은 이름 중 몇 번째" 로 짝을 짓습니다 → 클래스 이름을 바꾸면 그 요소는 "없는 요소"로 나옵니다 (바꾼 곳은 눈으로 확인). */
(function () {
  var W = window.WISAqa = window.WISAqa || function (page, opt) { return W.run(page, opt); };
  W.spec = W.spec || {};
  W.WIDTHS = [1440, 1100, 820, 390];
  var AREA = /^(geo-|cmp-|ads-|cta$)/;
  var STATE = /^(on|go|in|res|rst|play|open|show|active|done|fill|is-[\w-]+|h|fd-[lr]|ar-[lr]|lf|dn|up|cur|sel|hot|now|t1|launch|ready|seen|vis|run|anim|pause|paused|stop|end|first|last|out|off|prev|next|enter|leave|lit|glow|swap|flip|tick|pulse|rv|reveal|revealed|visible|loaded|inview)$/;
  var TYPO = ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "color", "text-align", "font-variant-numeric"];
  var BOX = ["display", "position", "padding", "border-top", "border-right", "border-bottom", "border-left", "border-radius", "background-color", "background-image", "box-shadow", "gap", "flex-direction", "justify-content", "align-items", "object-fit", "overflow", "transform", "filter"];
  var NAME = { "font-family": "폰트", "font-size": "글자 크기", "font-weight": "굵기", "line-height": "줄 높이", "letter-spacing": "자간", color: "글자색", "text-align": "정렬", "font-variant-numeric": "숫자 폭(고정폭)", display: "표시", position: "위치 방식", padding: "안쪽 여백", "border-top": "위 테두리", "border-right": "오른쪽 테두리", "border-bottom": "아래 테두리", "border-left": "왼쪽 테두리", "border-radius": "모서리", "background-color": "바탕색", "background-image": "바탕 그라데이션 · 이미지", "box-shadow": "그림자", gap: "사이 간격", "flex-direction": "배치 방향", "justify-content": "가로 정렬", "align-items": "세로 정렬", "object-fit": "이미지 맞춤", overflow: "넘침", transform: "변형(축소 · 회전)", filter: "필터" };
  var HOLD = 7200;   // 맨 위에서 가만히 지켜보는 시간 (키워드 교체 2.4초 × 3)
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function areas() { return [].slice.call(document.querySelectorAll("[id]")).filter(function (e) { return AREA.test(e.id) && !e.parentElement.closest("[id^='geo-'],[id^='cmp-'],[id^='ads-'],#cta"); }); }
  function sig(e) { var c = [].slice.call(e.classList).filter(function (x) { return !STATE.test(x); }).sort(); return e.tagName.toLowerCase() + (c.length ? "." + c.join(".") : ""); }
  function hasText(e) { for (var n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; }
  function fam(v) { return v.split(",")[0].replace(/["']/g, "").replace(/ Variable$/, "").trim(); }   // Pretendard Variable = Pretendard (같은 글꼴)
  // 영역마다 요소 목록 (svg 안쪽 · 숨겨진 요소 안쪽은 건너뜀)
  function walk(fn) {
    areas().forEach(function (a) {
      var cnt = {};
      (function rec(e) {
        var s = e === a ? "@" : sig(e); cnt[s] = (cnt[s] || 0) + 1;
        var key = a.id + "|" + s + "|" + cnt[s];
        var cs = getComputedStyle(e), hidden = cs.display === "none";
        fn(e, key, cs, hidden, a);
        if (hidden || e.tagName.toLowerCase() === "svg" || e.id === "vh") return;
        for (var c = e.firstElementChild; c; c = c.nextElementSibling) rec(c);
      })(a);
    });
  }
  // 스크립트 움직임: 맨 위에서 잠시 지켜본 뒤(바뀌는 횟수 = 간격) 천천히 끝까지 내리며 클래스 · 스타일 · 글자가 바뀌는 요소 기록
  async function watchDyn() {
    var keyOf = new Map(); walk(function (e, k) { keyOf.set(e, k); });
    var dyn = new Set(), hold = true, last = {}, tick = {};
    var mo = new MutationObserver(function (list) {
      var now = performance.now();
      list.forEach(function (m) {
        var t = m.target.nodeType === 1 ? m.target : m.target.parentElement; while (t && !keyOf.has(t)) t = t.parentElement; if (!t) return;
        var k = keyOf.get(t); dyn.add(k);
        if (hold) { var ar = k.split("|")[0]; if (!(ar in last) || now - last[ar] > 400) tick[ar] = (tick[ar] || 0) + 1; last[ar] = now; }   // 영역마다 · 0.4초 안에 이어진 변화는 한 번으로
      });
    });
    scrollTo(0, 0); await sleep(600);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class", "style"], childList: true, characterData: true });
    await sleep(HOLD); hold = false;
    var H = document.documentElement.scrollHeight, step = Math.round(innerHeight * 0.7);
    for (var y = 0; y <= H; y += step) { scrollTo(0, y); await sleep(1100); }
    scrollTo(0, H); await sleep(1500);
    mo.disconnect();
    scrollTo(0, 0); await sleep(900);
    var tk = {}; Object.keys(tick).forEach(function (a) { if (tick[a] >= 3) tk[a] = tick[a]; });
    return { dyn: Array.from(dyn).filter(function (k) { return !/\|@\|/.test(k); }), tick: tk };
  }
  // 스타일시트에서 조건에 맞는 선택자를 모아, 그 선택자에 걸리는 요소 key 목록
  function ruleKeys(pick) {
    var sels = [];
    [].slice.call(document.styleSheets).forEach(function (sh) {
      var rs; try { rs = sh.cssRules; } catch (e) { return; }
      (function scan(list, inRm) { [].slice.call(list).forEach(function (r) {
        if (r.cssRules && !r.selectorText) { var mt = r.media ? r.media.mediaText : ""; var rm = inRm || /prefers-reduced-motion/.test(mt); if (rm || !r.media || matchMedia(mt).matches) scan(r.cssRules, rm); return; }
        if (r.selectorText) r.selectorText.split(/,(?![^(]*\))/).forEach(function (p) { var t = pick(p.trim(), inRm); if (t) sels.push(t); });
      }); })(rs, false);
    });
    var set = new Set();
    walk(function (e, k, cs, hidden) { if (hidden) return; for (var i = 0; i < sels.length; i++) { try { if (e.matches(sels[i])) { set.add(k); break; } } catch (x) {} } });
    return Array.from(set);
  }
  var bare = function (s) { return s.replace(/::?[\w-]+(\([^)]*\))?/g, "").trim() || "*"; };
  // 호버: ":hover" 가 붙은 요소(호버 대상) · "a:hover .x" 면 a 가 대상
  function hoverKeys() { return ruleKeys(function (p, rm) { if (rm || p.indexOf(":hover") < 0) return ""; return bare(p.slice(0, p.indexOf(":hover"))); }); }
  // 동작 줄이기: @media (prefers-reduced-motion: reduce) 안 규칙이 걸리는 요소
  var wide = function (s) { return /(^|[\s>+~])\*$|^(html|body|\*)$/.test(s); };   // 모든 요소에 걸리는 규칙(*) 은 빼고 요소별 규칙만
  function rmKeys() { return ruleKeys(function (p, rm) { if (!rm) return ""; var b = bare(p); return wide(b) ? "" : b; }); }
  function styles(dyn) {
    var dset = new Set(dyn || []), flag = new Map(), flagS = new Map(), keyOfEl = new Map();
    // 전환(transition)은 끝난 값으로 읽음 · 숫자는 소수 1자리로 맞춤 (기기마다 소수점 끝자리 차이)
    var off = document.createElement("style"); off.textContent = "*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}"; document.head.appendChild(off); document.body.offsetHeight;
    var rnd = function (v) { return v.replace(/-?\d+\.\d+/g, function (n) { return (+(+n).toFixed(1)).toString(); }); };
    var tT = [], tI = {}, bT = [], bI = {}, el = {}, anim = {}, at = {};
    var idx = function (T, I, s) { if (!(s in I)) { I[s] = T.length; T.push(s); } return I[s]; };
    walk(function (e, k, cs, hidden, a) {
      if (hidden) { el[k] = "x"; return; }
      var r = e.getBoundingClientRect(), ar = a.getBoundingClientRect();
      var t = hasText(e) ? idx(tT, tI, TYPO.map(function (p) { var v = cs.getPropertyValue(p); return p === "font-family" ? fam(v) : v; }).join("|")) : "";
      var b = idx(bT, bI, rnd(BOX.map(function (p) { return cs.getPropertyValue(p); }).join("|")));
      // 움직이는 요소 = 애니메이션이 돌고 있거나, 자신 · 부모가 스크립트로 바뀌는 요소 (시점에 따라 값이 다를 수 있음)
      var up = flag.get(e.parentElement) || false, me = up || dset.has(k) || (e.getAnimations && e.getAnimations().some(function (x) { return x.playState === "running"; }));
      flag.set(e, me); var mv = me ? 1 : "";
      var sc = (flagS.get(e.parentElement) || false) || dset.has(k); flagS.set(e, sc);   // 스크립트로 바뀌는 요소와 그 안쪽만 (CSS 반복 애니메이션은 제외)
      el[k] = [t, b, Math.round(r.width), Math.round(r.height), Math.round(r.left - ar.left), mv, "", sc ? 1 : ""].join(",");
      if (me) for (var p = e.parentElement; p && p !== a.parentElement; p = p.parentElement) { var pk = keyOfEl.get(p); if (pk && el[pk] && el[pk] !== "x") { var f = el[pk].split(","); if (f[6] === "1") break; f[6] = "1"; el[pk] = f.join(","); } }
      keyOfEl.set(e, k);
      var an = cs.animationName; if (an && an !== "none") { anim[k] = an; at[k] = cs.animationDuration + " · " + cs.animationDelay + " · " + cs.animationIterationCount; }
      ["::before", "::after"].forEach(function (ps) {   // 가상 요소 애니메이션 (CTA 뒤 빛 등)
        var pc = getComputedStyle(e, ps); if (pc.content === "none" || !pc.animationName || pc.animationName === "none") return;
        anim[k + ps] = pc.animationName; at[k + ps] = pc.animationDuration + " · " + pc.animationDelay + " · " + pc.animationIterationCount;
      });
    });
    off.remove();
    return { typo: tT, box: bT, el: el, anim: anim, at: at };
  }
  W.collect = async function () {
    var d = await watchDyn();
    var s = styles(d.dyn); s.dyn = d.dyn; s.tick = d.tick; s.hover = hoverKeys(); s.rm = rmKeys(); s.w = innerWidth;
    return s;
  };

  // ---------- 기본 확인 (시안 값 없이 어느 폭에서나) ----------
  function basic() {
    var out = [], vw = document.documentElement.clientWidth;
    // 1) 가로 넘침: 화면 밖으로 나간 요소 중 잘라 주는 부모(overflow)가 없는 가장 바깥 요소
    if (document.documentElement.scrollWidth > vw + 1) {
      var hits = [];
      [].slice.call(document.body.querySelectorAll("*")).forEach(function (e) {
        if (e.closest("#wisa-qa,#vh")) return;
        var r = e.getBoundingClientRect(); if (!r.width || (r.right <= vw + 1 && r.left >= -1)) return;
        for (var p = e.parentElement; p && p !== document.body; p = p.parentElement) { var o = getComputedStyle(p); if (o.overflowX !== "visible" || o.position === "fixed") return; }
        if (hits.some(function (h) { return h.contains(e); })) return;
        hits.push(e);
      });
      out.push({ g: "가로 넘침", d: "페이지 폭 " + document.documentElement.scrollWidth + " > 화면 " + vw + " (옆으로 밀림)", els: hits.slice(0, 20) });
    }
    // 2) 깨진 이미지 (경로 · 파일 이름 확인)
    [].slice.call(document.images).forEach(function (im) { if (im.closest("#vh")) return; if (im.complete && im.naturalWidth === 0 && (im.currentSrc || im.src)) out.push({ g: "깨진 이미지", d: (im.currentSrc || im.src).split("/").slice(-3).join("/"), els: [im] }); });
    // 3) 불러오지 못한 폰트
    if (document.fonts) document.fonts.forEach(function (f) { if (f.status === "error") out.push({ g: "폰트", d: "불러오지 못함: " + f.family + " " + f.weight, els: [] }); });
    // 4) 시안 전용 코드
    var vh = document.getElementById("vh"); if (vh) out.push({ g: "시안 전용 코드", d: "시안 히스토리 버튼(#vh)이 남아 있음 · 구현하지 않음", els: [vh] });
    if (window.WISAcheck) out.push({ g: "시안 전용 코드", d: "시안 점검 스크립트(visual-check.js)가 연결되어 있음", els: [] });
    return out;
  }
  async function loadAll() {   // 늦게 불러오는 이미지까지 보이도록 끝까지 한 번 내림
    var H = document.documentElement.scrollHeight, step = Math.round(innerHeight * 0.9);
    for (var y = 0; y <= H; y += step) { scrollTo(0, y); await sleep(250); }
    scrollTo(0, 0); await sleep(600);
  }

  // ---------- 비교 ----------
  function guessPage() { var p = location.pathname.split("/").pop().replace(/\.html?$/, ""); return W.spec[p] ? p : Object.keys(W.spec)[0]; }
  W.run = async function (page, opt) {
    opt = opt || {};
    page = page || guessPage();
    var S = W.spec[page]; if (!S) { console.warn("[WISA 검수] 시안 값 파일(spec-" + page + ".js)을 먼저 불러오세요."); return; }
    var w = innerWidth; var ref = S[w];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) console.warn("[WISA 검수] 기기에 '동작 줄이기'가 켜져 있어 애니메이션 비교가 맞지 않습니다. 끄고 다시 실행하세요.");
    if (!ref) {   // 경계 폭: 기본 확인만
      panel("경계 폭 " + w + "px — 기본 확인 중…");
      await loadAll(); var b = basic(); show(page, w, null, b);
      console.log("[WISA 검수] " + page + " @" + w + " 기본 확인", b); return { basic: b };
    }
    panel("검사 중… 맨 위에서 " + HOLD / 1000 + "초 지켜본 뒤 페이지를 천천히 끝까지 내립니다 (약 " + Math.round(HOLD / 1000 + document.documentElement.scrollHeight / innerHeight * 0.8 + 3) + "초). 화면을 건드리지 마세요.");
    var cur = await W.collect();
    var res = compare(ref, cur, opt.tol == null ? 2 : opt.tol);
    var bs = basic();
    show(page, w, res, bs);
    res.basic = bs;
    console.log("[WISA 검수] " + page + " @" + w, res.sum, bs); return res;
  };
  function compare(A, B, tol) {
    var out = { miss: [], hide: [], typo: [], box: [], size: [], anim: [], rm: [], hover: [], dyn: [], extra: 0 };
    var dynSet = new Set(A.dyn), bDyn = new Set(B.dyn);
    var moving = function (k) { return dynSet.has(k); };
    var live = function (k) { return B.el[k] != null && B.el[k] !== "x"; };
    var mvEl = function (k) { var a = A.el[k], b = B.el[k]; return dynSet.has(k) || bDyn.has(k) || (a && a !== "x" && a.split(",")[7] === "1") || (b && b !== "x" && b.split(",")[7] === "1"); };   // 스크립트로 바뀌는 요소(와 그 안쪽) = 순간에 따라 애니메이션이 붙었다 빠짐
    Object.keys(A.el).forEach(function (k) {
      var a = A.el[k], b = B.el[k];
      if (b == null) { out.miss.push({ k: k, mv: dynSet.has(k) || (a !== "x" && a.split(",")[5] === "1") }); return; }
      if (a === "x" || b === "x") { if (a !== b) out.hide.push({ k: k, d: a === "x" ? "시안은 이 해상도에서 숨김 · 구현은 보임" : "시안은 보임 · 구현은 숨김", mv: dynSet.has(k) || bDyn.has(k) }); return; }
      a = a.split(","); b = b.split(","); var mv = moving(k) || a[5] === "1" || b[5] === "1";
      if (a[0] !== "" && b[0] !== "") {
        var ta = A.typo[a[0]].split("|"), tb = B.typo[b[0]].split("|"), NV = TYPO.length - 1;
        if (ta[NV] !== tb[NV]) out.typo.push({ k: k, d: NAME["font-variant-numeric"] + " " + ta[NV] + " → " + tb[NV] });   // 숫자 폭은 움직이는 숫자에 쓰는 값이라 움직여도 그대로 비교
        ta[NV] = tb[NV] = ""; var d = diffRow(TYPO, ta.join("|"), tb.join("|")); if (d) out.typo.push({ k: k, d: d, mv: mv });
      }
      var d2 = diffRow(BOX, A.box[a[1]], B.box[b[1]]); if (d2) out.box.push({ k: k, d: d2, mv: mv });
      var dz = []; if (Math.abs(a[2] - b[2]) > tol) dz.push("가로 " + a[2] + " → " + b[2]); if (Math.abs(a[3] - b[3]) > tol) dz.push("세로 " + a[3] + " → " + b[3]); if (Math.abs(a[4] - b[4]) > tol) dz.push("영역 안 가로 위치 " + a[4] + " → " + b[4]);
      if (dz.length) out.size.push({ k: k, d: dz.join(" · "), mv: mv || a[6] === "1" || b[6] === "1" });
    });
    Object.keys(A.anim).forEach(function (k) {
      var base = k.replace(/::(before|after)$/, ""); if (!live(base)) return; var bn = B.anim[k], mb = mvEl(base);
      if (!bn) out.anim.push({ k: k, d: "애니메이션 없음 (시안: " + A.anim[k] + ")", mv: mb });
      else if (bn !== A.anim[k]) out.anim.push({ k: k, d: "이름 다름 " + A.anim[k] + " → " + bn + " (같은 움직임인지 확인)", mv: mb });
      else if (A.at && A.at[k] && B.at[k] && A.at[k] !== B.at[k]) out.anim.push({ k: k, d: "시간 · 지연 · 반복 " + A.at[k] + " → " + B.at[k], mv: mb });
    });
    if (A.rm) { var rs = new Set(B.rm); A.rm.forEach(function (k) { if (live(k) && !rs.has(k)) out.rm.push({ k: k, d: "동작 줄이기(prefers-reduced-motion) 규칙 없음 · 이 기기 설정에서도 계속 움직임", mv: mvEl(k) }); }); }
    var hv = new Set(B.hover); A.hover.forEach(function (k) { if (live(k) && !hv.has(k)) out.hover.push({ k: k, d: "호버 스타일 없음" }); });
    var dy = new Set(B.dyn); A.dyn.forEach(function (k) { if (B.el[k] != null && !dy.has(k)) out.dyn.push({ k: k, d: "스크롤 · 시간에 따라 바뀌는 움직임이 없음 (스크립트 빠짐 의심)" }); });
    if (A.tick) Object.keys(A.tick).forEach(function (a) { var x = A.tick[a], y = (B.tick || {})[a] || 0; if (Math.abs(x - y) > Math.max(1, Math.round(x * 0.3))) out.dyn.push({ k: a + "|@|1", d: "바뀌는 간격 다름 · 맨 위에서 " + HOLD / 1000 + "초 동안 이 영역이 바뀐 횟수 시안 " + x + "번 → 구현 " + y + "번 (키워드 교체 · 자동 넘김 시간 확인)" }); });
    out.extra = Object.keys(B.el).filter(function (k) { return A.el[k] == null; }).length;
    var n = function (L) { return L.filter(function (x) { return !x.mv; }).length; }, nr = 0; ["miss", "hide", "typo", "box", "size", "anim", "rm", "hover", "dyn"].forEach(function (g) { nr += out[g].length - n(out[g]); });
    out.sum = { "시안에 있는데 없는 요소": n(out.miss), "숨김 차이": n(out.hide), "글자": n(out.typo), "모양": n(out.box), "크기 · 위치": n(out.size), "애니메이션": n(out.anim), "동작 줄이기": n(out.rm), "호버": n(out.hover), "스크립트 움직임": n(out.dyn), "움직이는 요소 참고": nr, "시안에 없는 요소": out.extra };
    return out;
  }
  function diffRow(P, x, y) { if (x === y) return ""; x = (x || "").split("|"); y = (y || "").split("|"); return P.map(function (p, i) { return x[i] !== y[i] ? NAME[p] + " " + short(x[i]) + " → " + short(y[i]) : ""; }).filter(Boolean).join(" · "); }
  function short(v) { v = v == null ? "-" : v; return v.length > 60 ? v.slice(0, 57) + "…" : v; }

  // ---------- 결과 창 ----------
  function find(k) { k = k.replace(/::(before|after)$/, ""); var hit = null; walk(function (e, kk) { if (!hit && kk === k) hit = e; }); return hit; }
  function panel(html) {
    var p = document.getElementById("wisa-qa"); if (!p) { p = document.createElement("div"); p.id = "wisa-qa"; document.body.appendChild(p); }
    p.setAttribute("style", "position:fixed;top:12px;right:12px;bottom:12px;width:min(440px,calc(100vw - 24px));z-index:2147483647;background:#fff;color:#101828;border:1px solid #d0d5dd;border-radius:12px;box-shadow:0 12px 32px rgba(16,24,40,.18);font:13px/1.5 system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden");
    p.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid #eaecf0;display:flex;justify-content:space-between;align-items:center"><b>WISA 개발 검수</b><button type="button" data-x style="border:0;background:none;font-size:18px;cursor:pointer">×</button></div><div data-b style="padding:12px 16px;overflow:auto;flex:1">' + html + "</div>";
    p.querySelector("[data-x]").onclick = function () { p.remove(); var o = document.getElementById("wisa-qa-hl"); if (o) o.remove(); };
    return p;
  }
  function mark(el) {
    el.scrollIntoView({ block: "center" });
    setTimeout(function () { var r2 = el.getBoundingClientRect(), o = document.getElementById("wisa-qa-hl"); if (!o) { o = document.createElement("div"); o.id = "wisa-qa-hl"; document.body.appendChild(o); }
      o.setAttribute("style", "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #d92d20;border-radius:4px;left:" + (r2.left - 3) + "px;top:" + (r2.top - 3) + "px;width:" + (r2.width + 6) + "px;height:" + (r2.height + 6) + "px"); }, 300);
  }
  function show(page, w, r, bs) {
    var G = [["miss", "시안에 있는데 구현에 없는 요소"], ["hide", "해상도별 숨김 차이"], ["typo", "글자 (폰트 · 크기 · 굵기 · 줄 높이 · 자간 · 색 · 숫자 폭)"], ["box", "모양 (여백 · 테두리 · 모서리 · 바탕 · 그림자 · 정렬 · 축소)"], ["size", "크기 · 위치 (±2px 넘는 것)"], ["anim", "애니메이션 (이름 · 시간 · 반복)"], ["rm", "동작 줄이기"], ["hover", "호버"], ["dyn", "스크립트 움직임 (스크롤 · 시간 · 간격)"]];
    var real = function (L) { return L.filter(function (x) { return !x.mv; }); }, ref = function (L) { return L.filter(function (x) { return x.mv; }); };
    var total = bs.length + (r ? G.reduce(function (s, g) { return s + real(r[g[0]]).length; }, 0) : 0), totalRef = r ? G.reduce(function (s, g) { return s + ref(r[g[0]]).length; }, 0) : 0;
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
    var row = function (it) { return "<div data-k=\"" + esc(it.k) + "\" style='margin:4px 0;padding:6px 8px;border-radius:6px;background:#f9fafb;cursor:pointer;" + (it.mv ? "color:#98a2b3" : "") + "'><code style='font-size:11px;word-break:break-all'>" + esc(it.k) + "</code>" + (it.d ? "<br>" + esc(it.d) : "") + "</div>"; };
    var list = function (L) { var t = L.slice(0, 300).map(row).join(""); return L.length > 300 ? t + "<div>… 외 " + (L.length - 300) + "개 (콘솔 결과 참고)</div>" : t; };
    var h = "<p style='margin:0 0 8px'><b>" + esc(page) + " · " + w + "px</b>" + (r ? "" : " (경계 폭 · 기본 확인만)") + " — 고칠 곳 <b style='color:" + (total ? "#d92d20" : "#079455") + "'>" + total + "개</b>" + (totalRef ? " · 움직이는 요소 참고 " + totalRef + "개" : "") + (r && r.extra ? " · 시안에 없는 요소 " + r.extra + "개" : "") + "</p><p style='margin:0 0 12px;color:#475467'>항목을 누르면 그 요소로 이동해 빨간 테두리로 표시합니다." + (r ? " <span style='color:#98a2b3'>회색 = 움직이는 요소(키워드 교체 · 타이핑 · 자동 탭 · 숫자 올라가기)와 그 부모라, 재는 순간에 따라 값이 다를 수 있음 → 눈으로만 확인.</span>" : "") + "</p>";
    var bEls = [];
    if (!bs.length) h += "<div style='margin:6px 0;color:#079455'>✓ 기본 확인 (가로 넘침 · 깨진 이미지 · 폰트 · 시안 전용 코드)</div>";
    else h += "<details open style='margin:6px 0'><summary style='cursor:pointer;font-weight:600;color:#d92d20'>기본 확인 · " + bs.length + "</summary>" + bs.map(function (b) { var i = bEls.push(b.els) - 1; return "<div data-bi=\"" + i + "\" style='margin:4px 0;padding:6px 8px;border-radius:6px;background:#f9fafb;cursor:pointer'><b>" + esc(b.g) + "</b><br>" + esc(b.d) + (b.els.length > 1 ? " · 요소 " + b.els.length + "개 (누를 때마다 다음)" : "") + "</div>"; }).join("") + "</details>";
    if (r) G.forEach(function (g) {
      var R = real(r[g[0]]), F = ref(r[g[0]]);
      if (!R.length) h += "<div style='margin:6px 0;color:#079455'>✓ " + g[1] + "</div>";
      else h += "<details" + (R.length < 30 ? " open" : "") + " style='margin:6px 0'><summary style='cursor:pointer;font-weight:600;color:#d92d20'>" + g[1] + " · " + R.length + "</summary>" + list(R) + "</details>";
      if (F.length) h += "<details style='margin:2px 0 8px 16px'><summary style='cursor:pointer;color:#98a2b3'>움직이는 요소 참고 · " + F.length + "</summary>" + list(F) + "</details>";
    });
    var p = panel(h), turn = {};
    p.querySelector("[data-b]").addEventListener("click", function (e) {
      var bb = e.target.closest("[data-bi]");
      if (bb) { var i = +bb.getAttribute("data-bi"), L = bEls[i]; if (L && L.length) { turn[i] = ((turn[i] == null ? -1 : turn[i]) + 1) % L.length; mark(L[turn[i]]); } return; }
      var d = e.target.closest("[data-k]"); if (!d) return; var el = find(d.getAttribute("data-k"));
      if (!el) { d.style.outline = "2px solid #d92d20"; return; }
      mark(el);
    });
  }
})();
