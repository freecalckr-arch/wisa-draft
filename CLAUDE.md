# WISA 시안 저장소 · Claude 작업 규칙

여러 Claude 계정이 이 저장소 하나로 작업합니다. 이 파일이 작업 기준입니다.

## 원본 위치
- PC 폴더: `E:\00.작업\01.업무\03.위사\wisa-draft` (이 PC 에서는 이 폴더에서 작업 · 다른 PC 는 git clone)
- 시안 원본은 이 저장소의 HTML 파일입니다. 아티팩트는 확인용 사본일 뿐, 수정은 여기서 합니다.
- 시안 보기(고객 공유용): https://freecalckr-arch.github.io/wisa-draft/
- 작업 전 `git pull`, 작업 후 `git add` · `git commit` · `git push`. 푸시하면 1~2분 뒤 위 주소에 반영됩니다.

## 파일
- `onsite.html` 온사이트마케팅 · `geo.html` GEO · `index.html` 시안 목록
- `assets/` 공용 이미지 · 폰트 (새 이미지는 `assets/geo/...` 아래에 추가하고 상대 경로로 참조)
- `docs/` 디자인 규칙 사이트 (왼쪽 메뉴 = `docs/assets/docs.js` 의 NAV · 새 규격 페이지는 기존 페이지를 복사해 만들고 NAV 에 한 줄 추가)

## 반드시 지킬 것
- 영역 이름(흐름 순서): 히어로 `#geo-hero` · 문제 `#geo-why` · 그래프 `#geo-market` · 단계(탭 타입 · 카드 타입) `#geo-how` · 해결 `#geo-diagnosis` · 리포트 `#geo-report` · 사례 `#geo-ref` · FAQ `#geo-faq` · CTA `#cta` / 부속: URL `#geo-scope` (GEO) · 다짐 띠 `#geo-vow`
- 화면 이미지는 PC 크기로 그리고, 1439 이하에서는 `s = min(1, 칸 폭 ÷ PC 가로)` 비율로 축소 (레이아웃 재배치 · 가로만 변경 · 확대 금지). 문제 551×300 · 단계 560×483 · 해결 460×380.
- 히어로는 파란 박스(`.sh-visual`)만 규격: 세로 PC · PC 최소 460 / 태블릿 · 모바일 444.
- 그래프 영역 그래프 세로: 태블릿 220 · 모바일 210 (전용 그림 chart-tb · chart-mo).
- 해상도: PC ≥1440 · PC 최소 1024~1439 · 태블릿 768~1023 · 모바일 ≤767. 수정 후 1440 · 1100 · 820 · 390 에서 확인하고, 모바일에서 페이지가 옆으로 밀리지 않는지 확인.
- 수정 내용은 각 HTML 맨 위 `[개발 전달]` 주석과 `patch-NNN` 주석으로 남깁니다.
- 시안 히스토리(`#vh` 의 `data-items`)의 지난 시안 링크는 지우지 않습니다. 새 차수를 만들면 한 줄 추가합니다.
