/* WISA 개발 검수 스크립트 · 구현한 페이지를 시안 값과 자동 비교합니다.
   사용법 (docs/qa.html "자동 점검" 탭):
   1) 구현한 페이지에 아래 두 줄을 잠시 넣습니다 (검수 후 삭제).
        <script src="(경로)/qa/spec-geo.js"></script>   ← 페이지 이름에 맞는 시안 값 파일
        <script src="(경로)/qa/qa-check.js"></script>
   2) 브라우저 폭을 1440 · 1100 · 820 · 390 중 하나로 맞춥니다 (개발자 도구 기기 툴바).
   3) 콘솔에서  await WISAqa()  실행 → 화면 오른쪽에 결과 창이 뜨고, 항목을 누르면 그 요소로 이동합니다.
   비교 대상: 영역(#geo-hero ~ #cta) 안 모든 요소의 글자(폰트 · 크기 · 굵기 · 줄 높이 · 자간 · 색) · 모양(여백 · 테두리 · 모서리 · 바탕 · 그림자 · 정렬) ·
   크기(가로 · 세로 · 영역 안 가로 위치) · 숨김 여부 · 애니메이션 · 호버 · 스크립트 움직임.
   요소는 "영역 id + 태그 + 클래스 + 같은 이름 중 몇 번째" 로 짝을 짓습니다 → 시안 클래스 이름을 그대로 쓰면 정확히 비교됩니다. */
(function () {
  var W = window.WISAqa = window.WISAqa || function (page, opt) { return W.run(page, opt); };
  W.spec = W.spec || {};
  W.WIDTHS = [1440, 1100, 820, 390];
  var AREA = /^(geo-|cmp-|ads-|cta$)/;
  var STATE = /^(on|go|in|res|rst|play|open|show|active|done|fill|is-[\w-]+|h|fd-[lr]|ar-[lr]|lf|dn|up|cur|sel|hot|now|t1|launch|ready|seen|vis|run|anim|pause|paused|stop|end|first|last|out|off|prev|next|enter|leave|lit|glow|swap|flip|tick|pulse|rv|reveal|revealed|visible|loaded|inview)$/;
  var TYPO = ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "color", "text-align"];
  var BOX = ["display", "position", "padding", "border-top", "border-right", "border-bottom", "border-left", "border-radius", "background-color", "background-image", "box-shadow", "gap", "flex-direction", "justify-content", "align-items", "object-fit", "overflow", "transform", "filter"];
  var NAME = { "font-family": "폰트", "font-size": "글자 크기", "font-weight": "굵기", "line-height": "줄 높이", "letter-spacing": "자간", color: "글자색", "text-align": "정렬", display: "표시", position: "위치 방식", padding: "안쪽 여백", "border-top": "위 테두리", "border-right": "오른쪽 테두리", "border-bottom": "아래 테두리", "border-left": "왼쪽 테두리", "border-radius": "모서리", "background-color": "바탕색", "background-image": "바탕 그라데이션 · 이미지", "box-shadow": "그림자", gap: "사이 간격", "flex-direction": "배치 방향", "justify-content": "가로 정렬", "align-items": "세로 정렬", "object-fit": "이미지 맞춤", overflow: "넘침", transform: "변형(축소 · 회전)", filter: "필터" };
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
  // 스크립트 움직임: 천천히 끝까지 내리며 클래스 · 스타일 · 글자가 바뀌는 요소 기록
  async function watchDyn() {
    var keyOf = new Map(); walk(function (e, k) { keyOf.set(e, k); });
    var dyn = new Set();
    var mo = new MutationObserver(function (list) { list.forEach(function (m) { var t = m.target.nodeType === 1 ? m.target : m.target.parentElement; while (t && !keyOf.has(t)) t = t.parentElement; if (t) dyn.add(keyOf.get(t)); }); });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class", "style"], childList: true, characterData: true });
    var H = document.documentElement.scrollHeight, step = Math.round(innerHeight * 0.7);
    for (var y = 0; y <= H; y += step) { scrollTo(0, y); await sleep(1100); }
    scrollTo(0, H); await sleep(1500);
    mo.disconnect();
    scrollTo(0, 0); await sleep(900);
    return [].slice.call(dyn).filter(function (k) { return !/\|@\|/.test(k); });
  }
  function hoverKeys() {
    var sels = [];
    [].slice.call(document.styleSheets).forEach(function (sh) {
      var rs; try { rs = sh.cssRules; } catch (e) { return; }
      (function scan(list) { [].slice.call(list).forEach(function (r) { if (r.cssRules && !r.selectorText) { if (!r.media || matchMedia(r.media.mediaText).matches) scan(r.cssRules); return; } if (r.selectorText && r.selectorText.indexOf(":hover") > -1) r.selectorText.split(/,(?![^(]*\))/).forEach(function (p) { if (p.indexOf(":hover") > -1) sels.push(p.trim()); }); }); })(rs);
    });
    // :hover 가 붙은 요소(호버 대상)를 찾음: "a:hover .x" 면 a 가 대상
    var targets = sels.map(function (p) { var i = p.indexOf(":hover"); var head = p.slice(0, i); return head.replace(/::?[\w-]+(\([^)]*\))?/g, "").trim() || "*"; });
    var set = new Set();
    walk(function (e, k, cs, hidden) { if (hidden) return; for (var i = 0; i < targets.length; i++) { try { if (e.matches(targets[i])) { set.add(k); break; } } catch (x) {} } });
    return [].slice.call(set);
  }
  function styles(dyn) {
    var dset = new Set(dyn || []), flag = new Map(), keyOfEl = new Map();
    // 전환(transition)은 끝난 값으로 읽음 · 숫자는 소수 1자리로 맞춤 (기기마다 소수점 끝자리 차이)
    var off = document.createElement("style"); off.textContent = "*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}"; document.head.appendChild(off); document.body.offsetHeight;
    var rnd = function (v) { return v.replace(/-?d+.d+/g, function (n) { return (+(+n).toFixed(1)).toString(); }); };
    var tT = [], tI = {}, bT = [], bI = {}, el = {}, anim = {};
    var idx = function (T, I, s) { if (!(s in I)) { I[s] = T.length; T.push(s); } return I[s]; };
    walk(function (e, k, cs, hidden, a) {
      if (hidden) { el[k] = "x"; return; }
      var r = e.getBoundingClientRect(), ar = a.getBoundingClientRect();
      var t = hasText(e) ? idx(tT, tI, TYPO.map(function (p) { var v = cs.getPropertyValue(p); return p === "font-family" ? fam(v) : v; }).join("|")) : "";
      var b = idx(bT, bI, rnd(BOX.map(function (p) { return cs.getPropertyValue(p); }).join("|")));
      // 움직이는 요소 = 애니메이션이 돌고 있거나, 자신 · 부모가 스크립트로 바뀌는 요소 (시점에 따라 값이 다를 수 있음)
      var up = flag.get(e.parentElement) || false, me = up || dset.has(k) || (e.getAnimations && e.getAnimations().some(function (x) { return x.playState === "running"; }));
      flag.set(e, me); var mv = me ? 1 : "";
      el[k] = [t, b, Math.round(r.width), Math.round(r.height), Math.round(r.left - ar.left), mv, ""].join(",");
      if (me) for (var p = e.parentElement; p && p !== a.parentElement; p = p.parentElement) { var pk = keyOfEl.get(p); if (pk && el[pk] && el[pk] !== "x") { var f = el[pk].split(","); if (f[6] === "1") break; f[6] = "1"; el[pk] = f.join(","); } }
      keyOfEl.set(e, k);
      var an = cs.animationName; if (an && an !== "none") anim[k] = an;
    });
    off.remove();
    return { typo: tT, box: bT, el: el, anim: anim };
  }
  W.collect = async function () {
    var dyn = await watchDyn();
    var s = styles(dyn); s.dyn = dyn; s.hover = hoverKeys(); s.w = innerWidth;
    return s;
  };

  // ---------- 비교 ----------
  function guessPage() { var p = location.pathname.split("/").pop().replace(/\.html?$/, ""); return W.spec[p] ? p : Object.keys(W.spec)[0]; }
  W.run = async function (page, opt) {
    opt = opt || {};
    page = page || guessPage();
    var S = W.spec[page]; if (!S) { console.warn("[WISA 검수] 시안 값 파일(spec-" + page + ".js)을 먼저 불러오세요."); return; }
    var w = innerWidth; var ref = S[w];
    if (!ref) { console.warn("[WISA 검수] 지금 폭 " + w + "px · 1440 · 1100 · 820 · 390 중 하나로 맞춰 주세요 (개발자 도구 기기 툴바)."); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) console.warn("[WISA 검수] 기기에 '동작 줄이기'가 켜져 있어 애니메이션 비교가 맞지 않습니다. 끄고 다시 실행하세요.");
    panel("검사 중… 페이지를 천천히 끝까지 내립니다 (약 " + Math.round(document.documentElement.scrollHeight / innerHeight * 0.8 + 3) + "초). 화면을 건드리지 마세요.");
    var cur = await W.collect();
    var res = compare(ref, cur, opt.tol == null ? 2 : opt.tol);
    show(page, w, res);
    console.log("[WISA 검수] " + page + " @" + w, res.sum); return res;
  };
  function compare(A, B, tol) {
    var out = { miss: [], hide: [], typo: [], box: [], size: [], anim: [], hover: [], dyn: [], extra: 0 };
    var dynSet = new Set(A.dyn), bDyn = new Set(B.dyn);
    var moving = function (k) { return dynSet.has(k); };
    Object.keys(A.el).forEach(function (k) {
      var a = A.el[k], b = B.el[k];
      if (b == null) { out.miss.push({ k: k, mv: dynSet.has(k) || (a !== "x" && a.split(",")[5] === "1") }); return; }
      if (a === "x" || b === "x") { if (a !== b) out.hide.push({ k: k, d: a === "x" ? "시안은 이 해상도에서 숨김 · 구현은 보임" : "시안은 보임 · 구현은 숨김", mv: dynSet.has(k) || bDyn.has(k) }); return; }
      a = a.split(","); b = b.split(","); var mv = moving(k) || a[5] === "1" || b[5] === "1";
      if (a[0] !== "" && b[0] !== "") { var d = diffRow(TYPO, A.typo[a[0]], B.typo[b[0]]); if (d) out.typo.push({ k: k, d: d, mv: mv }); }
      var d2 = diffRow(BOX, A.box[a[1]], B.box[b[1]]); if (d2) out.box.push({ k: k, d: d2, mv: mv });
      var dz = []; if (Math.abs(a[2] - b[2]) > tol) dz.push("가로 " + a[2] + " → " + b[2]); if (Math.abs(a[3] - b[3]) > tol) dz.push("세로 " + a[3] + " → " + b[3]); if (Math.abs(a[4] - b[4]) > tol) dz.push("영역 안 가로 위치 " + a[4] + " → " + b[4]);
      if (dz.length) out.size.push({ k: k, d: dz.join(" · "), mv: mv || a[6] === "1" || b[6] === "1" });
    });
    Object.keys(A.anim).forEach(function (k) { if (B.el[k] == null || B.el[k] === "x") return; var bn = B.anim[k]; if (!bn) out.anim.push({ k: k, d: "애니메이션 없음 (시안: " + A.anim[k] + ")", mv: dynSet.has(k) && bDyn.has(k) }); else if (bn !== A.anim[k]) out.anim.push({ k: k, d: "이름 다름 " + A.anim[k] + " → " + bn + " (같은 움직임인지 확인)" }); });
    var hv = new Set(B.hover); A.hover.forEach(function (k) { if (B.el[k] != null && B.el[k] !== "x" && !hv.has(k)) out.hover.push({ k: k, d: "호버 스타일 없음" }); });
    var dy = new Set(B.dyn); A.dyn.forEach(function (k) { if (B.el[k] != null && !dy.has(k)) out.dyn.push({ k: k, d: "스크롤 · 시간에 따라 바뀌는 움직임이 없음 (스크립트 빠짐 의심)" }); });
    out.extra = Object.keys(B.el).filter(function (k) { return A.el[k] == null; }).length;
    var n = function (L) { return L.filter(function (x) { return !x.mv; }).length; }, nr = 0; ["miss", "hide", "typo", "box", "size", "anim", "hover", "dyn"].forEach(function (g) { nr += out[g].length - n(out[g]); });
    out.sum = { "시안에 있는데 없는 요소": n(out.miss), "숨김 차이": n(out.hide), "글자": n(out.typo), "모양": n(out.box), "크기 · 위치": n(out.size), "애니메이션": n(out.anim), "호버": n(out.hover), "스크립트 움직임": n(out.dyn), "움직이는 요소 참고": nr, "시안에 없는 요소": out.extra };
    return out;
  }
  function diffRow(P, x, y) { if (x === y) return ""; x = (x || "").split("|"); y = (y || "").split("|"); return P.map(function (p, i) { return x[i] !== y[i] ? NAME[p] + " " + short(x[i]) + " → " + short(y[i]) : ""; }).filter(Boolean).join(" · "); }
  function short(v) { v = v == null ? "-" : v; return v.length > 60 ? v.slice(0, 57) + "…" : v; }

  // ---------- 결과 창 ----------
  function find(k) { var hit = null; walk(function (e, kk) { if (!hit && kk === k) hit = e; }); return hit; }
  function panel(html) {
    var p = document.getElementById("wisa-qa"); if (!p) { p = document.createElement("div"); p.id = "wisa-qa"; document.body.appendChild(p); }
    p.setAttribute("style", "position:fixed;top:12px;right:12px;bottom:12px;width:min(440px,calc(100vw - 24px));z-index:2147483647;background:#fff;color:#101828;border:1px solid #d0d5dd;border-radius:12px;box-shadow:0 12px 32px rgba(16,24,40,.18);font:13px/1.5 system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden");
    p.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid #eaecf0;display:flex;justify-content:space-between;align-items:center"><b>WISA 개발 검수</b><button type="button" data-x style="border:0;background:none;font-size:18px;cursor:pointer">×</button></div><div data-b style="padding:12px 16px;overflow:auto;flex:1">' + html + "</div>";
    p.querySelector("[data-x]").onclick = function () { p.remove(); var o = document.getElementById("wisa-qa-hl"); if (o) o.remove(); };
    return p;
  }
  function show(page, w, r) {
    var G = [["miss", "시안에 있는데 구현에 없는 요소"], ["hide", "해상도별 숨김 차이"], ["typo", "글자 (폰트 · 크기 · 굵기 · 줄 높이 · 자간 · 색)"], ["box", "모양 (여백 · 테두리 · 모서리 · 바탕 · 그림자 · 정렬 · 축소)"], ["size", "크기 · 위치 (±2px 넘는 것)"], ["anim", "애니메이션"], ["hover", "호버"], ["dyn", "스크립트 움직임 (스크롤 · 시간)"]];
    var real = function (L) { return L.filter(function (x) { return !x.mv; }); }, ref = function (L) { return L.filter(function (x) { return x.mv; }); };
    var total = G.reduce(function (s, g) { return s + real(r[g[0]]).length; }, 0), totalRef = G.reduce(function (s, g) { return s + ref(r[g[0]]).length; }, 0);
    var row = function (it) { return "<div data-k=\"" + it.k.replace(/"/g, "&quot;") + "\" style='margin:4px 0;padding:6px 8px;border-radius:6px;background:#f9fafb;cursor:pointer;" + (it.mv ? "color:#98a2b3" : "") + "'><code style='font-size:11px;word-break:break-all'>" + it.k + "</code>" + (it.d ? "<br>" + it.d : "") + "</div>"; };
    var list = function (L) { var t = L.slice(0, 300).map(row).join(""); return L.length > 300 ? t + "<div>… 외 " + (L.length - 300) + "개 (콘솔 결과 참고)</div>" : t; };
    var h = "<p style='margin:0 0 8px'><b>" + page + " · " + w + "px</b> — 고칠 곳 <b style='color:" + (total ? "#d92d20" : "#079455") + "'>" + total + "개</b>" + (totalRef ? " · 움직이는 요소 참고 " + totalRef + "개" : "") + (r.extra ? " · 시안에 없는 요소 " + r.extra + "개" : "") + "</p><p style='margin:0 0 12px;color:#475467'>항목을 누르면 그 요소로 이동해 빨간 테두리로 표시합니다. <span style='color:#98a2b3'>회색 = 움직이는 요소(키워드 교체 · 타이핑 · 자동 탭 · 숫자 올라가기)와 그 부모라, 재는 순간에 따라 값이 다를 수 있음 → 눈으로만 확인.</span></p>";
    G.forEach(function (g) {
      var R = real(r[g[0]]), F = ref(r[g[0]]);
      if (!R.length) h += "<div style='margin:6px 0;color:#079455'>✓ " + g[1] + "</div>";
      else h += "<details" + (R.length < 30 ? " open" : "") + " style='margin:6px 0'><summary style='cursor:pointer;font-weight:600;color:#d92d20'>" + g[1] + " · " + R.length + "</summary>" + list(R) + "</details>";
      if (F.length) h += "<details style='margin:2px 0 8px 16px'><summary style='cursor:pointer;color:#98a2b3'>움직이는 요소 참고 · " + F.length + "</summary>" + list(F) + "</details>";
    });
    var p = panel(h);
    p.querySelector("[data-b]").addEventListener("click", function (e) {
      var d = e.target.closest("[data-k]"); if (!d) return; var el = find(d.getAttribute("data-k"));
      if (!el) { d.style.outline = "2px solid #d92d20"; return; }
      el.scrollIntoView({ block: "center" });
      setTimeout(function () { var r2 = el.getBoundingClientRect(), o = document.getElementById("wisa-qa-hl"); if (!o) { o = document.createElement("div"); o.id = "wisa-qa-hl"; document.body.appendChild(o); }
        o.setAttribute("style", "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #d92d20;border-radius:4px;left:" + (r2.left - 3) + "px;top:" + (r2.top - 3) + "px;width:" + (r2.width + 6) + "px;height:" + (r2.height + 6) + "px"); }, 300);
    });
  }
})();
