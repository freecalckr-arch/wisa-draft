/* WISA 비주얼 점검 스크립트 (docs/visual.html)
   마케팅 시안 페이지를 PC 1440 으로 열고, 애니메이션이 한 바퀴 돈 뒤 실행합니다.
     const s = document.createElement('script'); s.src = 'docs/assets/visual-check.js'; document.head.appendChild(s);
     // 로드 후
     await WISAcheck()      // 영역을 차례로 보여 준 뒤 문제 목록 (콘솔 표 + 반환값)
   점검: ① 팔레트 밖 색  ② 규격 밖 글자 크기  ③ 화면 창 안 여백 쏠림(위·아래 / 왼·오른쪽)  ④ 잘린 글자  ⑤ 한 화면 색 계열 3개 이상
   실제 앱 화면을 본뜬 브랜드 고유색은 감싼 요소에 data-brand 를 붙이면 ①에서 빠집니다. */
(function () {
  var PALETTE = "000000 027a48 039855 054f31 05603a 101323 101828 12b76a 1570ef 175cd3 1849a9 194185 1d2939 2d31a6 2d3282 2e90fa 32d583 344054 3538cd 444ce7 475467 53b1fd 6172f3 667085 6ce9a6 7a271a 7a2e0e 8098f9 84caff 912018 93370d 98a2b3 a4bcfd a6f4c5 b2ddff b42318 b54708 c7d7fe d0d5dd d1e9ff d1fadf d92d20 dc6803 e0eaff eaecf0 ecfdf3 eef4ff eff8ff f04438 f2f4f7 f5f8ff f5faff f6fef9 f79009 f8f9fc f97066 f9fafb fcfcfd fda29b fdb022 fec84b fecdca fedf89 fee4e2 fef0c7 fef3f2 fffaeb fffbfa fffcf5 ffffff".split(" ");
  // 화면 이미지 안 글자 크기 (PC 기준 · px)
  var FONT = [10, 11, 12, 12.5, 13, 14.5, 16, 20, 24, 28];
  // 점검할 비주얼: [이름, 선택자, 여백 쏠림 점검 여부]
  var AREAS = [
    ["히어로", "#geo-hero .sh-visual", false],
    ["문제", "#geo-why .pn", true],
    ["단계", "#geo-how .vw-win", true],
    ["해결", "#geo-diagnosis .vw-win", true]
  ];
  var TOL = 12; // 여백 차이 허용 (px)
  // 색 계열 (그레이 · 블랙 · 화이트는 계열로 세지 않음)
  var FAM = {
    "Primary": "2e90fa 1570ef 175cd3 1849a9 194185 53b1fd 84caff b2ddff d1e9ff eff8ff f5faff",
    "Indigo": "6172f3 444ce7 3538cd 2d31a6 2d3282 8098f9 a4bcfd c7d7fe e0eaff eef4ff f5f8ff",
    "Error(레드)": "f04438 d92d20 b42318 912018 7a271a f97066 fda29b fecdca fee4e2 fef3f2 fffbfa",
    "Warning(오렌지)": "f79009 dc6803 b54708 93370d 7a2e0e fdb022 fec84b fedf89 fef0c7 fffaeb fffcf5",
    "Success(그린)": "12b76a 039855 027a48 05603a 054f31 32d583 6ce9a6 a6f4c5 d1fadf ecfdf3 f6fef9"
  };
  function fam(h) { for (var k in FAM) if (FAM[k].indexOf(h) > -1) return k; return null; }

  function hex(c) {
    var m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
    if (!m || (m[4] !== undefined && +m[4] === 0)) return null;
    return [m[1], m[2], m[3]].map(function (v) { return (+v).toString(16).padStart(2, "0"); }).join("");
  }
  function shown(e) {
    var r = e.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (var x = e; x && x !== document.body; x = x.parentElement) {
      var c = getComputedStyle(x);
      if (c.display === "none" || c.visibility === "hidden" || +c.opacity === 0) return false;
    }
    return true;
  }
  function label(e) {
    var t = (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return e.tagName.toLowerCase() + (e.classList.length ? "." + [].slice.call(e.classList).join(".") : "") + (t ? " “" + t + "”" : "");
  }
  function leaves(root, skip) {
    var out = [];
    (function walk(n) {
      [].forEach.call(n.children, function (c) {
        if (skip && skip.contains(c)) return;
        if (!shown(c)) return;
        var tag = c.tagName.toLowerCase();
        if (tag === "svg" || tag === "img" || !c.children.length) out.push(c);
        else walk(c);
      });
    })(root);
    return out;
  }

  // 스크롤 등장 애니메이션이 끝나도록 각 영역을 한 번씩 화면에 보여 준 뒤 점검
  window.WISAcheck = async function () {
    var y = scrollY, issues = [];
    // 등장 효과(transition)를 끄고 최종 상태로 점검
    var st = document.createElement("style");
    st.textContent = "*{transition-duration:0s!important;transition-delay:0s!important}";
    document.head.appendChild(st);
    for (var i = 0; i < AREAS.length; i++) {
      var boxes = document.querySelectorAll(AREAS[i][1]);
      for (var j = 0; j < boxes.length; j++) {
        boxes[j].scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise(function (r) { setTimeout(r, 600); });
        // 화면이 가려져 있으면 등장 효과가 멈춰 있으므로 끝 상태로 넘김
        document.querySelectorAll(".rv, .rv-mo").forEach(function (e) { e.classList.add("in"); });
        document.getAnimations().forEach(function (an) { if (window.CSSTransition && an instanceof CSSTransition) try { an.finish(); } catch (e) {} });
        run(AREAS[i], boxes[j], j, issues);
      }
    }
    st.remove();
    scrollTo(0, y);
    if (window.console && console.table) console.table(issues);
    return issues.length ? issues : "문제 없음";
  };
  function run(a, box, bi, issues) {
    var add = function (area, kind, what, detail) { issues.push({ 영역: area, 항목: kind, 요소: what, 내용: detail }); };
    (function () {
        if (!shown(box)) return;
        var name = a[0] + (bi ? " " + (bi + 1) : "");
        var seenC = {}, seenF = {}, fams = {};
        box.querySelectorAll("*").forEach(function (e) {
          if (!shown(e)) return;
          var cs = getComputedStyle(e);
          // ① 색
          if (!e.closest("[data-brand]") && e.tagName !== "IMG") {
            ["color", "backgroundColor", "borderTopColor", "fill", "stroke"].forEach(function (p) {
              if (p === "borderTopColor" && parseFloat(cs.borderTopWidth) === 0) return;
              if (p === "color" && ![].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); })) return;
              var h = hex(cs[p]);
              var fm = h && fam(h);
              if (fm) fams[fm] = (fams[fm] || 0) + 1;
              if (h && PALETTE.indexOf(h) < 0 && !seenC[h]) { seenC[h] = 1; add(name, "팔레트 밖 색", label(e), "#" + h + " (" + p + ")"); }
            });
          }
          // ② 글자 크기
          if ([].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); })) {
            var f = parseFloat(cs.fontSize);
            if (FONT.indexOf(f) < 0 && !seenF[f]) { seenF[f] = 1; add(name, "규격 밖 글자 크기", label(e), f + "px"); }
            // ④ 잘린 글자
            if (cs.overflow !== "visible" && cs.textOverflow !== "ellipsis" && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0)
              add(name, "잘린 글자", label(e), "보이는 폭 " + e.clientWidth + " < 내용 " + e.scrollWidth);
          }
        });
        // ⑤ 색 계열 수 — 그레이 + 포인트 블루가 기본, 증감 레드 · 경고 오렌지까지 3계열 이상이면 줄일 곳 확인
        var fk = Object.keys(fams);
        if (fk.length >= 3) add(name, "색 계열 많음", fk.length + "계열", fk.map(function (k) { return k + " " + fams[k]; }).join(" · ") + " (그레이 + 블루 1곳 기준)");
        // ③ 여백 쏠림 (머리줄 아래 ~ 창 아래 끝)
        if (!a[2]) return;
        var hd = box.querySelector(":scope > [class*='hd']");
        var B = box.getBoundingClientRect();
        var top = hd ? hd.getBoundingClientRect().bottom : B.top;
        var ls = leaves(box, hd);
        if (!ls.length) return;
        var u = { t: 1e9, b: -1e9, l: 1e9, r: -1e9 };
        ls.forEach(function (e) {
          var r = e.getBoundingClientRect();
          if (r.top < top - 1 || r.bottom > B.bottom + 1) return; // 창 밖으로 걸친 요소 제외
          u.t = Math.min(u.t, r.top); u.b = Math.max(u.b, r.bottom); u.l = Math.min(u.l, r.left); u.r = Math.max(u.r, r.right);
        });
        var g = { 위: Math.round(u.t - top), 아래: Math.round(B.bottom - u.b), 왼쪽: Math.round(u.l - B.left), 오른쪽: Math.round(B.right - u.r) };
        if (Math.abs(g.위 - g.아래) > TOL) add(name, "여백 쏠림 (세로)", "창 안 내용", "위 " + g.위 + " · 아래 " + g.아래 + " (같게)");
        if (Math.abs(g.왼쪽 - g.오른쪽) > TOL) add(name, "여백 쏠림 (가로)", "창 안 내용", "왼쪽 " + g.왼쪽 + " · 오른쪽 " + g.오른쪽 + " (같게 · 채팅 말풍선처럼 의도한 한쪽 정렬이면 무시)");
    })();
  }
})();
