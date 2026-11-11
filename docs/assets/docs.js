/* WISA 디자인 규칙 사이트 · 공용 스크립트
   - 상단 바 · 왼쪽 메뉴를 그립니다. 메뉴를 바꿀 때는 아래 NAV 만 고치면 모든 페이지에 반영됩니다.
   - 본문의 <section class="panel" data-tab="이름"> 이 2개 이상이면 탭을 만듭니다 (주소 #tab=이름 으로 유지).
   - 탭(또는 본문) 안의 h2 로 "이 페이지" 목차를 만듭니다.
   - [data-copy] 버튼은 지정한 요소의 글을 복사합니다. */
(function () {
  /* 메뉴는 두 덩어리: { part } 줄 아래에 분류(g)가 이어집니다.
     - 개발 전달: 개발자가 구현할 때 보는 규격 (드라이브 전달 폴더에 넣는 범위)
     - 시안 작업: 시안을 그릴 때만 쓰는 작업 규칙 (구현 대상 아님) */
  var NAV = [
    { part: "개발 전달" },
    { g: "시작하기", items: [["개요", "index.html"]] },
    { g: "기존 소스 수정", items: [["기존 수정 목록", "changes.html"]] },
    { g: "기초", items: [["해상도 구간", "breakpoints.html"], ["영역 이름", "sections.html"], ["그리드 · 여백", "grid.html"], ["컬러", "color.html"], ["타이포", "type.html"]] },
    { g: "영역 규격", items: [["히어로", "hero.html"], ["이미지", "image.html"], ["그래프", "graph.html"]] },
    { g: "컴포넌트", items: [["탭", null], ["카드", null], ["CTA", null]] },
    { g: "인터랙션", items: [["인터랙션 목록", null]] },
    { g: "페이지", items: [["GEO", "../geo.html"], ["온사이트마케팅", "../onsite.html"], ["CRM마케팅", "../crm.html"], ["리포트", "../report.html"], ["공식채널운영", "../sns-ops.html"], ["상품DB 연동", "../shopping-feed.html"]] },
    { part: "시안 작업" },
    { g: "작업 규칙", items: [["작업 방법", "workflow.html"], ["비주얼 공통", "visual.html"]] }
  ];

  var here = location.pathname.split("/").pop() || "index.html";
  var ext = '<svg class="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9"/></svg>';

  // 상단 바
  var bar = document.createElement("header");
  bar.className = "bar";
  bar.innerHTML =
    '<button class="menu" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="side">' +
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg></button>' +
    '<a class="brand" href="index.html"><img src="../assets/common/logo.svg" alt="WISA 디자인 규칙"></a>' +
    '<span class="sp"></span>' +
    '<a class="lnk" href="../index.html">시안 목록</a>';

  // 왼쪽 메뉴
  var side = document.createElement("nav");
  side.className = "side";
  side.id = "side";
  side.setAttribute("aria-label", "규칙 메뉴");
  // 분류 접기 · 펴기 (분류 이름 오른쪽 화살표 · 접은 상태는 이 브라우저에만 기억 · 지금 보는 페이지가 든 분류는 항상 펼침)
  var shut = {};
  try { shut = JSON.parse(localStorage.getItem("wisa-docs-nav") || "{}") || {}; } catch (e) { shut = {}; }
  var chev = '<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  side.innerHTML = NAV.map(function (grp, gi) {
    if (grp.part) return '<p class="part' + (gi ? "" : " first") + '">' + grp.part + "</p>";
    var hasHere = grp.items.some(function (it) { return it[1] === here; });
    var open = hasHere || !shut[grp.g];
    return '<div class="grp' + (open ? "" : " shut") + '"><h4><button type="button" class="grp-t" aria-expanded="' + open + '" aria-controls="nav-g' + gi + '">' + grp.g + chev + "</button></h4><ul id=\"nav-g" + gi + "\">" + grp.items.map(function (it) {
      if (!it[1]) return '<li><span class="off">' + it[0] + "<small>준비 중</small></span></li>";
      var out = it[1].indexOf("../") === 0;
      var cur = !out && it[1] === here ? ' aria-current="page"' : "";
      var badge = it[2] ? '<em class="badge">' + it[2] + "</em>" : "";
      return '<li><a href="' + it[1] + '"' + cur + ">" + it[0] + (out ? ext : badge) + "</a></li>";
    }).join("") + "</ul></div>";
  }).join("");
  side.addEventListener("click", function (e) {
    var t = e.target.closest(".grp-t");
    if (!t) return;
    var g = t.closest(".grp"), isShut = g.classList.toggle("shut");
    t.setAttribute("aria-expanded", isShut ? "false" : "true");
    shut[t.textContent] = isShut;
    try { localStorage.setItem("wisa-docs-nav", JSON.stringify(shut)); } catch (e2) {}
  });

  var dim = document.createElement("div");
  dim.className = "dim";
  document.body.prepend(dim);
  document.body.prepend(side);
  document.body.prepend(bar);

  var btn = bar.querySelector(".menu");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }
  btn.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  dim.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  // 탭
  var body = document.querySelector(".body");
  var panels = body ? [].slice.call(body.querySelectorAll(":scope > .panel")) : [];
  var tabs = null;
  function anchors(scope) {
    var old = scope.querySelector(":scope > .anchors");
    if (old) old.remove();
    var hs = [].slice.call(scope.querySelectorAll(":scope > h2[id]"));
    if (hs.length < 2) return;
    var ul = document.createElement("ul");
    ul.className = "anchors";
    ul.innerHTML = hs.map(function (h) { return '<li><a href="#' + h.id + '">' + h.textContent + "</a></li>"; }).join("");
    scope.prepend(ul);
  }
  if (panels.length > 1) {
    tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.setAttribute("role", "tablist");
    panels.forEach(function (p, i) {
      var name = p.dataset.tab;
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.id = "tab-" + i;
      b.textContent = name;
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", b.id);
      b.addEventListener("click", function () { show(i, true); });
      tabs.appendChild(b);
    });
    tabs.addEventListener("keydown", function (e) {
      var k = e.key, bs = [].slice.call(tabs.children), i = bs.indexOf(document.activeElement);
      if (i < 0 || (k !== "ArrowRight" && k !== "ArrowLeft")) return;
      var n = (i + (k === "ArrowRight" ? 1 : bs.length - 1)) % bs.length;
      show(n, true); bs[n].focus();
    });
    body.parentNode.insertBefore(tabs, body);
    panels.forEach(anchors);
    var want = decodeURIComponent((location.hash.match(/tab=([^&]+)/) || [])[1] || "");
    var start = Math.max(0, panels.findIndex(function (p) { return p.dataset.tab === want; }));
    // 주소의 #id 가 다른 탭 안에 있으면 그 탭을 엽니다
    if (!want && location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var owner = target && target.closest(".panel");
      if (owner) start = panels.indexOf(owner);
    }
    show(start, false);
  } else if (body) {
    anchors(panels[0] || body);
  }
  function show(i, push) {
    [].forEach.call(tabs.children, function (b, j) {
      b.setAttribute("aria-selected", j === i ? "true" : "false");
      b.tabIndex = j === i ? 0 : -1;
    });
    panels.forEach(function (p, j) { p.hidden = j !== i; });
    if (push) {
      try { history.replaceState(null, "", "#tab=" + encodeURIComponent(panels[i].dataset.tab)); } catch (e) {}
      var top = tabs.getBoundingClientRect().top + scrollY - 48;
      if (scrollY > top) scrollTo(0, top);
    }
  }

  // 복사
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = document.getElementById(b.dataset.copy);
      var done = function () { b.textContent = "복사됨"; setTimeout(function () { b.textContent = "복사"; }, 1500); };
      var pick = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(el.textContent).then(done, pick); } catch (e) { pick(); }
    });
  });
})();
