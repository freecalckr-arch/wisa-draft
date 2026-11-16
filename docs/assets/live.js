/* 규칙 사이트 · 실제 화면 미리보기 (2026-11-16)
   <div class="live" data-src="../geo.html" data-sel="#geo-faq .faq" data-m="24"></div>
   - 실제 시안 페이지를 iframe 으로 불러와 data-sel 요소만 보이게 잘라 보여 줍니다 (캡처 없음 · 시안을 고치면 같이 바뀜).
   - 위 버튼으로 해상도(1440 · 1100 · 820 · 390)를 바꿉니다. 칸보다 넓으면 칸 폭에 맞춰 축소합니다.
   - 미리보기 안에서 마우스 올리기 · 누르기가 됩니다 (링크 이동만 막음).
   - data-m = 요소 둘레 여백(기본 24) · data-w = 처음 해상도(기본 1440) · data-ws = 고를 해상도 목록(예 "1440,390") */
(function () {
  var W_ALL = [[1440, "PC 1440"], [1100, "PC 최소 1100"], [820, "태블릿 820"], [390, "모바일 390"]];
  var HIDE = "html,body{overflow:hidden!important;scroll-behavior:auto!important}body *{visibility:hidden!important}" +
    ".consult,.page-nav,.vh,.header{display:none!important}";
  function setup(box) {
    var ws = (box.dataset.ws || "1440,1100,820,390").split(",").map(Number);
    var W = +(box.dataset.w || ws[0]), M = +(box.dataset.m || 24), sel = box.dataset.sel, src = box.dataset.src;
    box.innerHTML = '<div class="live-bar"></div><div class="live-f"><iframe title="실제 화면 미리보기" loading="lazy"></iframe></div>';
    var bar = box.querySelector(".live-bar"), frame = box.querySelector(".live-f"), fr = box.querySelector("iframe");
    bar.innerHTML = W_ALL.filter(function (x) { return ws.indexOf(x[0]) > -1; }).map(function (x) {
      return '<button type="button" data-w="' + x[0] + '"' + (x[0] === W ? ' class="on"' : "") + ">" + x[1] + "</button>";
    }).join("") + '<a href="' + src + (sel.charAt(0) === "#" ? sel.split(" ")[0] : "") + '" target="_blank" rel="noopener">페이지에서 보기 ↗</a>';
    function target() { var d = fr.contentDocument; return d && d.querySelector(sel); }
    function fit() {
      var el = target(); if (!el) return;
      var r = el.getBoundingClientRect(), s = Math.min(1, frame.clientWidth / W);
      var h = Math.round(r.height + M * 2);
      fr.style.width = W + "px"; fr.style.height = h + "px";
      fr.style.transform = "scale(" + s + ")";
      fr.style.left = Math.max(0, (frame.clientWidth - W * s) / 2) + "px";
      frame.style.height = Math.ceil(h * s) + "px";
      fr.contentWindow.scrollTo(0, r.top + fr.contentWindow.scrollY - M);
    }
    fr.addEventListener("load", function () {
      var d = fr.contentDocument; if (!d) return;
      var st = d.createElement("style");
      st.textContent = HIDE + sel.split(",").map(function (s) { return s + "," + s + " *"; }).join(",") + "{visibility:visible!important}";
      d.head.appendChild(st);
      d.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (a) e.preventDefault(); }, true);
      fit(); setTimeout(fit, 400); setTimeout(fit, 1500);
      if (d.fonts) d.fonts.ready.then(fit);
      try { new fr.contentWindow.ResizeObserver(fit).observe(target()); } catch (e) {}
    });
    function load() { fr.style.width = W + "px"; fr.src = src; }
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      W = +b.dataset.w; [].forEach.call(bar.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); }); load();
    });
    box._fit = fit;
    load();
  }
  var boxes = [].slice.call(document.querySelectorAll(".live"));
  boxes.forEach(setup);
  var refit = function () { boxes.forEach(function (b) { b._fit && b._fit(); }); };
  addEventListener("resize", refit);
  addEventListener("hashchange", function () { setTimeout(refit, 60); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[role=tab]")) setTimeout(refit, 60); });
})();
