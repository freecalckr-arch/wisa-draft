# WISA 자사몰 마케팅 페이지 시안

자사몰 마케팅 페이지(GEO · 온사이트마케팅 · CRM마케팅 · 리포트) 시안의 원본 저장소입니다.
앞으로 수정은 이 저장소의 파일을 기준으로 합니다.

- 시안 보기: https://freecalckr-arch.github.io/wisa-draft/
- 공통 규칙: [docs/size-rules.html](docs/size-rules.html) (영역 이름 · 이미지 · 그래프 사이즈)

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 시안 목록 (시작 페이지) |
| `onsite.html` | 온사이트마케팅 시안 |
| `geo.html` | GEO 시안 |
| `assets/` | 폰트 · 로고 · 상품 · 프로필 이미지 (모든 페이지 공용) |
| `docs/` | 작업 규칙 |

## 작업 방법

1. 작업 전 최신 상태 받기: `git pull`
2. 해당 페이지 HTML 수정 (공통 규칙: `docs/size-rules.html`)
3. 페이지 HTML 맨 위 `[개발 전달]` 주석에 수정 내용 기록
4. 올리기: `git add` → `git commit` → `git push` (1~2분 뒤 시안 보기 주소에 반영)

- 지난 시안은 각 페이지 왼쪽 아래 "시안 히스토리"(`#vh` 의 `data-items`)에 링크로 남깁니다. 새 차수를 만들면 이 목록에 한 줄 추가합니다.
- 다른 Claude 계정에서 작업할 때도 이 저장소를 받아서(`git clone`) 수정하고 올립니다.
