/* WISA 비주얼 점검 스크립트 (docs/visual.html)
   마케팅 시안 페이지를 PC 1440 으로 열고, 애니메이션이 한 바퀴 돈 뒤 실행합니다.
     const s = document.createElement('script'); s.src = 'docs/assets/visual-check.js'; document.head.appendChild(s);
     // 로드 후
     await WISAcheck()      // 영역을 차례로 보여 준 뒤 문제 목록 (콘솔 표 + 반환값)
   점검: ① 팔레트 밖 색  ② 규격 밖 글자 크기  ③ 화면 창 안 여백 쏠림(위·아래 / 왼·오른쪽)  ④ 잘린 글자  ⑤ 한 화면 색 계열 3개 이상
         ⑥ 단계 탭: 탭을 하나씩 열어 화면 번호(.os8-p) 말풍선이 창 · 잘라 내는 칸 밖으로 잘리거나 다른 번호를 덮는지
   단계 탭을 누르므로 점검 뒤에는 탭 자동 전환이 멈춥니다 (새로고침하면 원래대로).
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
        if (c.classList.contains("os8-p")) return;   // 단계 번호는 여백 계산에서 뺌
        if (!shown(c)) return;
        var tag = c.tagName.toLowerCase();
        if (tag === "svg" || tag === "img" || !c.children.length) { out.push(c); return; }
        // 바탕 · 테두리 · 그림자가 있는 칸은 그 칸의 끝이 눈에 보이는 경계 (안쪽 글자 끝이 아니라)
        var cs = getComputedStyle(c);
        var full = c.getBoundingClientRect().width >= root.getBoundingClientRect().width * .95;   // 창 폭 전체를 덮는 바탕 칸은 배경으로 보고 뺌
        if (!full && (hex(cs.backgroundColor) || cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0)) out.push(c);
        walk(c);
      });
    })(root);
    return out;
  }

  // 스크롤 등장 애니메이션이 끝나도록 각 영역을 한 번씩 화면에 보여 준 뒤 점검
  window.WISAcheck = async function () {
    var y = scrollY, issues = [];
    var jt = document.querySelector("#geo-how .jt");
    var tabBtns = jt ? [].slice.call(jt.querySelectorAll(".jt-nav [data-jt]")) : [];
    // 등장 효과(transition)를 끄고 최종 상태로 점검
    var st = document.createElement("style");
    st.textContent = "*{transition-duration:0s!important;transition-delay:0s!important}";
    document.head.appendChild(st);
    var settle = async function () {
      await new Promise(function (r) { setTimeout(r, 600); });
      // 화면이 가려져 있으면 등장 효과가 멈춰 있으므로 끝 상태로 넘김
      document.querySelectorAll(".rv, .rv-mo").forEach(function (e) { e.classList.add("in"); });
      // 화면에 들어올 때 붙는 시작 클래스(vw-go · go)도 가려진 창에서는 늦게 붙으므로 직접 붙임
      document.querySelectorAll(".vw-anim").forEach(function (e) { e.classList.add("vw-go"); });
      document.querySelectorAll("[class*='-anim']").forEach(function (e) { e.classList.add("go"); });
      document.getAnimations().forEach(function (an) {   // 한 번만 도는 등장 효과(transition · 1회 animation)는 끝 상태로
        try { if (an.effect && an.effect.getTiming().iterations !== Infinity) an.finish(); } catch (e) {}
      });
    };
    for (var i = 0; i < AREAS.length; i++) {
      // 단계 탭 타입: 탭을 하나씩 열어 화면 + 번호 말풍선 점검
      if (AREAS[i][0] === "단계" && tabBtns.length) {
        jt.scrollIntoView({ block: "center", behavior: "instant" });
        for (var k = 0; k < tabBtns.length; k++) {
          tabBtns[k].click();
          await settle();
          var pan = jt.querySelectorAll(".jt-panel")[k];
          var win = pan && pan.querySelector(".vw-win");
          if (win) { run(["단계 " + (k + 1), AREAS[i][1], AREAS[i][2]], win, 0, issues); pins(win, "단계 " + (k + 1), issues); }
        }
        continue;
      }
      var boxes = document.querySelectorAll(AREAS[i][1]);
      for (var j = 0; j < boxes.length; j++) {
        boxes[j].scrollIntoView({ block: "center", behavior: "instant" });
        await settle();
        run(AREAS[i], boxes[j], j, issues);
      }
    }
    st.remove();
    scrollTo(0, y);
    if (window.console && console.table) console.table(issues);
    return issues.length ? issues : "문제 없음";
  };
  // ⑥ 단계 화면 번호(.os8-p) 말풍선: 페이지 스크립트(onsite-steps)와 같은 순서로 자리를 정해(오른쪽 → 왼쪽 → 아래)
  //    창 · 잘라 내는 칸 밖으로 나가는지, 다른 번호를 덮는지 확인
  function pins(win, name, issues) {
    var add = function (kind, what, detail) { issues.push({ 영역: name, 항목: kind, 요소: what, 내용: detail }); };
    var ps = [].slice.call(win.querySelectorAll(".os8-p")).filter(shown);
    if (!ps.length) return;
    var cv = document.createElement("canvas").getContext("2d");
    cv.font = "600 10.5px Pretendard, sans-serif";
    var rects = ps.map(function (p) { return p.getBoundingClientRect(); });
    ps.forEach(function (p, idx) {
      // 스크롤되는 화면(.sx)은 페이지 스크립트처럼 번호가 보이도록 스크롤한 뒤 잼
      var sx = p.closest(".sx");
      if (sx) {
        var yy = p.getBoundingClientRect().top - sx.getBoundingClientRect().top + sx.scrollTop - sx.clientHeight * .3;
        sx.scrollTop = Math.max(0, Math.min(yy, sx.scrollHeight - sx.clientHeight));
        rects = ps.map(function (q) { return q.getBoundingClientRect(); });
      }
      var r = rects[idx], s = r.width / (p.offsetWidth || r.width);
      var txt = p.dataset.l || "";
      if (!txt) { add("번호 이름 없음", "번호 " + p.textContent.trim(), "왼쪽 태그 수보다 번호가 많음"); return; }
      // 잘라 내는 범위 = 창 ∩ overflow 가 visible 이 아닌 조상
      var W = win.getBoundingClientRect(), c = { l: W.left, r: W.right, t: W.top, b: W.bottom };
      for (var e = p.parentElement; e && e !== win; e = e.parentElement) {
        var cs = getComputedStyle(e);
        if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
          var er = e.getBoundingClientRect();
          c.l = Math.max(c.l, er.left); c.r = Math.min(c.r, er.right); c.t = Math.max(c.t, er.top); c.b = Math.min(c.b, er.bottom);
        }
      }
      var lw = (cv.measureText(txt).width + 16) * s, lh = 22 * s, cy = (r.top + r.bottom) / 2;
      var fitR = r.right + 6 + lw <= c.r - 4, fitL = r.left - 6 - lw >= c.l + 4;
      var b, side;
      if (fitR) { side = "오른쪽"; b = { l: r.right + 6 * s, r: r.right + 6 * s + lw, t: cy - lh / 2, b: cy + lh / 2 }; }
      else if (fitL) { side = "왼쪽"; b = { l: r.left - 6 * s - lw, r: r.left - 6 * s, t: cy - lh / 2, b: cy + lh / 2 }; }
      else { side = "아래"; b = { l: r.right + 4 * s - lw, r: r.right + 4 * s, t: r.bottom + 6 * s, b: r.bottom + 6 * s + lh }; }
      var who = "번호 " + p.textContent.trim() + " “" + txt + "”";
      var out = [];
      if (b.l < c.l - 1) out.push("왼쪽 " + Math.round(c.l - b.l) + "px");
      if (b.r > c.r + 1) out.push("오른쪽 " + Math.round(b.r - c.r) + "px");
      if (b.t < c.t - 1) out.push("위 " + Math.round(c.t - b.t) + "px");
      if (b.b > c.b + 1) out.push("아래 " + Math.round(b.b - c.b) + "px");
      if (out.length) add("번호 말풍선 잘림", who, side + " 말풍선이 " + out.join(" · ") + " 잘림");
      rects.forEach(function (o, j) {
        if (j === idx) return;
        if (b.l < o.right && b.r > o.left && b.t < o.bottom && b.b > o.top) add("번호 말풍선 겹침", who, side + " 말풍선이 번호 " + ps[j].textContent.trim() + " 을 덮음");
      });
    });
  }
  window.WISAcheckPins = function (win) { var o = []; pins(win, "단계", o); return o; };   // 한 화면만 번호 점검 (디버그용)
  function run(a, box, bi, issues) {
    var add = function (area, kind, what, detail) { issues.push({ 영역: area, 항목: kind, 요소: what, 내용: detail }); };
    (function () {
        if (!shown(box)) return;
        var name = a[0] + (bi ? " " + (bi + 1) : "");
        var seenC = {}, seenF = {}, fams = {};
        box.querySelectorAll("*").forEach(function (e) {
          if (!shown(e) || e.closest(".os8-p")) return;   // 단계 번호는 공통 요소라 따로 점검(⑥)
          var cs = getComputedStyle(e);
          // ① 색
          if (!e.closest("[data-brand], .app") && e.tagName !== "IMG") {
            ["color", "backgroundColor", "borderTopColor", "fill", "stroke"].forEach(function (p) {
              if (p === "borderTopColor" && parseFloat(cs.borderTopWidth) === 0) return;
              if (p === "color" && ![].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); })) return;
              var h = hex(cs[p]);
              var fm = h && fam(h);
              if (fm) fams[fm] = (fams[fm] || 0) + 1;
              if (h && PALETTE.indexOf(h) < 0 && !seenC[h]) { seenC[h] = 1; add(name, "팔레트 밖 색", label(e), "#" + h + " (" + p + ")"); }
              else if (fm === "Warning(오렌지)" && !seenC[h]) { seenC[h] = 1; add(name, "오렌지 · 옐로 사용", label(e), "#" + h + " → 이슈는 Error 레드 · 그 외 그레이 (patch-273)"); }
            });
          }
          // ② 글자 크기
          if ([].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); })) {
            var f = parseFloat(cs.fontSize);
            if (f > 0 && FONT.indexOf(f) < 0 && !seenF[f]) { seenF[f] = 1; add(name, "규격 밖 글자 크기", label(e), f + "px"); }
            // ④ 잘린 글자
            if (cs.overflow !== "visible" && cs.textOverflow !== "ellipsis" && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0)
              add(name, "잘린 글자", label(e), "보이는 폭 " + e.clientWidth + " < 내용 " + e.scrollWidth);
          }
        });
        // ⑤ 색 계열 수 — 그레이 + 포인트 블루가 기본, 증감 · 이슈 레드까지 3계열 이상이면 줄일 곳 확인 (오렌지 · 옐로는 쓰지 않음)
        var fk = Object.keys(fams);
        if (fk.length >= 3) add(name, "색 계열 많음", fk.length + "계열", fk.map(function (k) { return k + " " + fams[k]; }).join(" · ") + " (그레이 + 블루 1곳 기준)");
        // ⑦ 문제 영역 하단 태그: 박스 가로 가운데 · 아래 끝에서 20px 위 (PC 기준 · 축소 비율 반영)
        if (a[0] === "문제") {
          var Bx = box.getBoundingClientRect(), sc = Bx.width / (box.offsetWidth || Bx.width);
          box.querySelectorAll(".me-tag, .hit-tag").forEach(function (t) {
            if (!shown(t)) return;
            var tr = t.getBoundingClientRect();
            var gap = Math.round((Bx.bottom - tr.bottom) / sc), mid = Math.round(((tr.left + tr.right) / 2 - (Bx.left + Bx.right) / 2) / sc);
            if (Math.abs(gap - 20) > 2 || Math.abs(mid) > 2) add(name, "하단 태그 위치", label(t), "아래 " + gap + " (20) · 가운데에서 " + mid + "px (0)");
          });
        }
        // ③ 여백 쏠림 (머리줄 아래 ~ 창 아래 끝)
        if (!a[2]) return;
        var hd = box.querySelector(":scope > [class*='hd']");
        var ft = box.querySelector(":scope > .ows-ft");   // 문제 영역 하단 태그 줄은 규격 위치라 여백 계산에서 뺌
        var B = box.getBoundingClientRect();
        var top = hd ? hd.getBoundingClientRect().bottom : B.top;
        var ls = leaves(box, hd).filter(function (e) { return !(ft && ft.contains(e)); });
        var bot = ft ? ft.getBoundingClientRect().top : B.bottom;   // 태그 줄 위까지가 내용 칸
        if (!ls.length) return;
        var u = { t: 1e9, b: -1e9, l: 1e9, r: -1e9 };
        ls.forEach(function (e) {
          var r = e.getBoundingClientRect();
          // 바탕 없는 글자 칸은 칸이 아니라 글자가 실제로 놓인 범위로 잼 (오른쪽 정렬 줄 번호 · 가운데 정렬 글자)
          var ecs = getComputedStyle(e);
          if (!e.children.length && e.textContent.trim() && !hex(ecs.backgroundColor) && ecs.boxShadow === "none" && !(parseFloat(ecs.borderTopWidth) > 0)) {
            var rg = document.createRange(); rg.selectNodeContents(e); var rr = rg.getBoundingClientRect(); if (rr.width) r = rr;
          }
          if (r.top < top - 1 || r.bottom > B.bottom + 1) return; // 창 밖으로 걸친 요소 제외
          u.t = Math.min(u.t, r.top); u.b = Math.max(u.b, r.bottom); u.l = Math.min(u.l, r.left); u.r = Math.max(u.r, r.right);
        });
        // 내용이 창 밖으로 이어지는 목업(잘린 쇼핑몰 화면 · 코드 편집기 · 프로필 구름)은 그 방향 점검 제외 (여백이 음수 = 의도한 걸침)
        var g = { 위: Math.round(u.t - top), 아래: Math.round(bot - u.b), 왼쪽: Math.round(u.l - B.left), 오른쪽: Math.round(B.right - u.r) };
        if (!(ft && ft.classList.contains("ov")) && g.위 >= 0 && g.아래 >= 0 && Math.abs(g.위 - g.아래) > TOL)   // 태그가 내용에 겹치는 화면(.ov)은 그라데이션으로 끝나므로 세로 쏠림 제외
          add(name, "여백 쏠림 (세로)", "창 안 내용", "위 " + g.위 + " · 아래 " + g.아래 + " (같게)");
        if (g.왼쪽 >= 0 && g.오른쪽 >= 0 && Math.abs(g.왼쪽 - g.오른쪽) > TOL) add(name, "여백 쏠림 (가로)", "창 안 내용", "왼쪽 " + g.왼쪽 + " · 오른쪽 " + g.오른쪽 + " (같게 · 채팅 말풍선처럼 의도한 한쪽 정렬이면 무시)");
    })();
  }
})();
