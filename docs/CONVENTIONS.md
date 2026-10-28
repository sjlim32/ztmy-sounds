# 컨벤션

## 프로젝트 구조

기능(feature) 단위로 나뉘어 있습니다 — 페이지·컴포넌트·데이터·도메인 로직을
전부 `src/features/<기능>/` 아래에 모으고, `src/app/`은 라우팅(페이지 조립)만
담당합니다. 여러 기능에서 공유하는 것만 `src/components/`, `src/lib/`에 둡니다.

```text
src/
  app/
    (pages)/               # 실제 페이지 라우트 그룹 (레이아웃에 헤더/푸터 포함)
      guide/                # /guide, /guide/[songId]
      slam/                 # /slam, /slam/[songId]
      info/                 # /info
      zutopia/              # /zutopia, /zutopia/[category], /zutopia/[category]/[slug],
                             # /zutopia/albums, /zutopia/songs
      credits/              # /credits
    (pwa)/                  # 서비스워커 전용 라우트 그룹 (레이아웃 없음)
      serwist/              # 서비스워커를 서빙하는 라우트 핸들러
      sw.ts                 # 서비스워커 엔트리
  features/                 # 기능 단위 모듈. 각 폴더는 보통 components/lib(/data) 구성
    guide/                  # 곡 가이드(영상+가사+응원법). *-context.tsx로 플레이어/모드 상태 보유
                             # 상세 화면 tablet 이상: 영상 위 GuideDetailToolbar
                             # (곡 목록 드로어 SongListDrawer / 뒤로가기=항상 목록으로 /
                             # 이전·다음 곡), 영상 아래 CallLegend(응원 표시
                             # 안내) | GuideToolsCard(자동 스크롤 + 곡별 오류
                             # 제보 — 모바일은 둘 다 가사 영역 안) 한 줄, 그 아래
                             # SongDescriptionPanel
                             # (Song.description, 없으면 lib/song-description.ts의
                             # 예시 목데이터를 "예시" 표시와 함께). 이 세로 열의
                             # 폭은 lib/player-layout.ts 한 곳에서 정한다.
                             # 응원 색·이름·설명은 lib/call-tag-style.ts.
                             # 응원 아이콘은 public/assets/guide/shamoji/의 샤모지
                             # 세트(그림만 256px `<이름>.webp`, 한자·영문 포함
                             # 512px `<이름>-label.webp`) — 스윙=swing, 클랩=clap,
                             # 떼창=sing, 댄스=dance. 응원 색은 이 아이콘 색에서 뽑았으므로
                             # 아이콘을 바꾸면 색도 함께 바꾼다. 슬램은
                             # public/assets/guide/slam.svg(노랑). 예전 응원
                             # 아이콘(옛 public/assets/song/)은 쓰지 않고
                             # shamoji/legacy/default/에 보관만 한다. 공지
                             # "응원법 구분 방법"도 샤모지 라벨 버전을 쓴다.
                             # 가사 아이콘은 모바일 22px /
                             # 태블릿 이상 28px(칸은 36px로 둘레 여백), 응원 표시
                             # 안내는 라벨 포함 버전 48px(CallIcon withLabel).
                             # 곡 목록(/guide) 필터: SongFilterBar(중요도 /
                             # 응원법 두 줄, AND) + lib/song-filter.ts. 중요도는
                             # Song.importance("essential" 필수 숙지 /
                             # "recommended" 예습 중요)를 곡 파일에 직접 적는다.
                             # 필터 상태는 레이아웃이 유지하는 동안 남고, 곡이
                             # 선택된 동안엔 적용하지 않는다(접힘 애니메이션용).
                             # 응원 단어(**…**/^…^)는 발음 줄에서만 응원 색
                             # 형광펜, 원문·번역·응원 설명은 배경·테두리 없이
                             # 응원 색 굵은 글자로만 표시한다. 응원 태그가
                             # 있는데 발음 줄에 그 모드의 강조 표시가 없으면
                             # 발음 줄 전체에 형광펜을 칠한다.
                             # 가사 줄은 [아이콘 칸 | 본문] 두 칸 그리드라 아이콘이
                             # 본문 첫 줄(응원 설명/원문) 세로 가운데에 맞고, 응원
                             # 태그가 이어지는 구간은 첫 줄에 아이콘 + 아래로
                             # 응원 색 세로선(lib/line-tag.ts getTagRunPositions,
                             # LyricLine RunLine/GutterMarker). ♫만 있는 간주 줄은
                             # 구분선 ── ♫ ── (MusicBreak, 응원 아이콘은 음표
                             # 옆), 재생 중엔 ♪♫♪가 박자 타듯 들썩이고 구분선이
                             # 분홍빛으로 밝아진다. 글자가 있는 간주(밴드 소개
                             # 등)는 기존 가운데 정렬 그대로.
                             # 재생 중인 줄은 테두리·둥근 모서리 없이 옅은 배경
                             # — 응원 줄은 그 응원 색, 아니면 보라(나머지 줄
                             # 글자는 흐리게, LyricsView의 :has 선택자)으로
                             # 표시하고, 가사 영역(LyricsView)은 배경 흐림 +
                             # 살짝 어둡게 해서 그 색이 사이트 배경과 섞이지
                             # 않게 한다. 가사 글자 크기는 발음 > 원문 > 번역.
                             # 재생 중인 응원 줄은 아이콘 칸도 강조 — 아이콘은
                             # 배경 없이 퍼지는 고리(PingRing) + 응원 색 빛, 구간
                             # 안 줄은 세로선 위 재생 점 + 후광·고리(ActiveHalo).
                             # 재생 중이 되어도 크기가 바뀌는 스타일(글자 굵기,
                             # 요소 개수 등)은 쓰지 않는다 — 줄이 바뀔 때마다
                             # 가사가 흔들려 보인다.
      data/
        songs/              # 정식 공개곡 — 곡 하나당 파일 하나, index.ts가 취합
        not-yet/            # 아직 가이드 미공개곡 데이터
        origin/             # 원본(수정 전) 가사/정보 백업
    home/                   # 홈 화면. 라우트(app/(pages)/page.tsx)는 서버
                             # 컴포넌트로 곡 제목만 뽑아 HomeScreen(클라이언트)에
                             # 넘긴다 — 곡 데이터를 홈에서 직접 import하면 가사
                             # 전체가 홈 번들에 실린다.
                             # PC: 왼쪽 위 로고(h1)+소개 문구(Header), 오른쪽 위
                             # 공식 링크(OfficialLinks), 왼쪽 공연 카드
                             # (NextEventCard) + 원정 카드 아래 공연 안내 버튼
                             # (ConcertQuickPanel, 패널은 오른쪽으로 열림), 오른쪽
                             # 메뉴(MainNavLink, 응원 가이드가 primary) + 곡
                             # 바로가기(PracticeShortcuts: 이어서 연습 = guide/
                             # lib/last-song.ts + 필수 숙지 곡).
                             # 메뉴와 곡 카드는 화면 높이와 상관없이 세로 1열,
                             # 높이가 모자라면 카드 안 전체가 스크롤.
                             # 화면 높이 700px 이하(xlow)는 푸터를 숨기고 왼쪽
                             # 열의 로고·포스터·카운트다운을 줄인다(왼쪽 열은
                             # 공연 안내 패널이 오른쪽으로 열려 스크롤 박스로
                             # 못 만든다 — 세로로 뭔가 더하면 1440×650에서 확인).
                             # PC 화면 가장자리 여백은 네 귀퉁이·푸터 모두 40px로
                             # 맞춘다(메뉴는 버튼 안쪽 여백 때문에 right-6).
                             # 모바일: 상단 바 [공식 링크 시트 | 로고 | 공유] →
                             # 소개 문구 → 메뉴 → 곡 바로가기 → 공연 카드 →
                             # 공연 안내 → 푸터. 360×640에서도
                             # 넘치지 않게 맞춰 두었으니 세로로 뭔가 더하면
                             # 그 크기에서 확인한다.
    info/                   # /info 페이지 콘텐츠 (info.mdx + 렌더 컴포넌트).
                             # 탭(공연/축제/콜라보/팝업) 소속은 info.tsx의
                             # INFO_TABS/INFO_TAB_SECTIONS 하나로만 관리하고
                             # (섹션 쪽엔 안 붙임 — 섹션 하나가 여러 탭에
                             # 동시에 속할 수 있어서), InfoTabs/TabSection/
                             # InfoTabContext가 이를 읽어 렌더링한다.
                             # 열린 탭은 주소 해시(/info#popup)에 두어 새로고침·
                             # 링크 공유에도 유지된다(탭 id = 해시).
                             # 공연 당일 시간표는 schedule.ts 한 곳에만 둔다 —
                             # /info의 일정표(ScheduleTimeline)와 홈의 공연 안내
                             # (features/home ConcertQuickPanel)가 같이 읽고,
                             # 당일엔 지금 시간대 줄을 강조한다(lib/schedule-
                             # status.ts, 현지 일본 시각 기준). 공연 관련 링크
                             # 모음은 links.ts. 공연이 바뀌면 둘 다 교체한다.
                             # DetailField/DetailList(라벨: 값 카드)는
                             # 티켓/굿즈 안내처럼 반복되는 목록에 재사용한다.
                             # ImageGallery는 이미지 묶음을 태블릿 이상에선
                             # 그리드로, 모바일에선 세로(stack) 또는 가로 넘김
                             # (swipe, 장수가 많을 때)으로 보여주고 어느 걸 눌러도
                             # 같은 확대 뷰에서 묶음 전체를 넘겨 본다.
    notice/                 # 공지사항 (MDX 콘텐츠 + 데이터 + 노출/해제 로직)
      content/              # 공지 MDX 프로즈
    zutopia/                 # 즛토피아 허브: 카테고리→항목 2단 구조(registry.ts) +
                             # 곡/앨범 DB(song-db/) + 지난 공연 DB(lives/) — 전부
                             # Supabase 기반(아래 "곡 데이터" 참고)
      guide-link.ts          # 응원 가이드(/guide/[songId]) 존재 여부 조회 —
                             # song-db와 lives가 공유
      lives/                # 지난 공연 데이터(data.ts, Supabase 기반) + 공용
                             # 컴포넌트(SongLink.tsx, DefaultLiveContent.tsx,
                             # 티켓 LiveTicket.tsx, 세트리스트 Setlist.tsx).
                             # tour_id가 있거나 slug가 투어 slug와 같은 lives는
                             # 투어에 종속된다 — 자기 상세 페이지 없이 투어
                             # slug를 공유하고(같은 slug가 여러 행이라 상세
                             # 라우트는 투어를 먼저 조회한다),
                             # 티켓·음원 링크는 tours 컬럼을 쓰며, 투어 상세의
                             # 공연 일정(TourDateList.tsx)에서 행을 누르면 곡/앨범
                             # DB와 같은 우측 드로어(SongDbDrawer)로 그 공연의
                             # 포스터·추가 이미지·세트리스트를 연다.
                             # 투어 공연일 세트리스트는 투어 공통 곡
                             # (setlists.tour_id) + 그 공연일 곡(setlists.live_id)을
                             # track_number로 합치고, 공연일에만 있는 곡은
                             # "선택곡"(ztmy-sky 행 배경·태그, 앙코르는 ztmy-sun)으로
                             # 강조한다. 일차(day_number)가 있는 곡은 "첫째날",
                             # "둘째날" 태그(ztmy-pink)로 일차를 표시한다.
                             # lives/tours.metadata.visited("first"/"second"…)가
                             # 있으면 내한 공연 — visit.ts가 파싱하고, 상세는
                             # VisitBadge, 목록 카드는 ztmy-sun 테두리 +
                             # "N 번째 내한" 문구로 강조한다.
                             # 공연별 수동 콘텐츠가 필요하면 lives/<슬러그>/
                             # content.mdx를 만들어 [slug]/page.tsx의
                             # CONTENT_BY_KEY에 등록한다(선택 사항).
      song-db/              # 곡/앨범 DB 조회·정렬·표시 로직 (Supabase 소스)
  components/               # 여러 기능이 공유하는 전역 컴포넌트
    mobile/                 # 모바일 전용 전역 컴포넌트
    icons/                  # 커스텀 SVG 아이콘 (외부 아이콘 라이브러리 미사용)
    PageScrollBody.tsx       # 스크롤 페이지(/info, /credits, /zutopia) 공용
                             # 안쪽 레이아웃 — 콘텐츠 + <Footer inline />
                             # 배치를 한 곳에서 관리 (아래 "페이지 스크롤 +
                             # Footer" 참고)
  data/                     # 사이트 전역 데이터 (특정 기능에 속하지 않음)
    artist.ts               # 아티스트 정보
    event.ts                # 공연 정보
    social-links.ts         # 소셜 링크
  lib/                      # 여러 기능이 공유하는 프레임워크 비의존 로직
    supabase/                # Supabase 클라이언트 (빌드 타임 전용 — 아래 "곡 데이터" 참고)
    seo.ts                   # 사이트 전역 메타데이터 상수 (SITE_NAME 등)
    use-install-prompt.ts    # PWA beforeinstallprompt/appinstalled 공용 훅
                             # (아래 "PWA 설치 프롬프트" 참고)
  fonts/                    # 로컬 폰트 원본 (LINE Seed KR, 851MkPOP) — 직접 로드하지 않음
    subset/                 # 실제로 로드되는 서브셋. dev·build 시작 때 자동 생성되며
                             # git에는 올리지 않음
```

`src/` 밖에는 빌드 보조 스크립트를 두는 `scripts/`가 있습니다
(`subset-fonts.mjs` — 폰트 서브셋 생성).

## Import

- 파일을 import할 때는 상대 경로(`../`, `./`)를 최대한 배제하고 `@/*`
  alias(`tsconfig.json`의 `@/* -> src/*`)를 씁니다 — 예: `../labels` 대신
  `@/features/zutopia/song-db/labels`. 같은 폴더 안의 형제 파일끼리도
  (`./SongDbDrawer` 같은) 예외 없이 적용합니다. 파일을 옮겨도 다른 파일의
  import 경로가 안 깨지고, 어디서 가져오는지 절대 경로로 한눈에 보입니다.

## 컴포넌트 구조

- 컴포넌트 파일은 위에서부터 다음 순서로 배치합니다.
  1. 타입/상수/유틸 함수
  2. 최상위로 export되는 메인 컴포넌트
  3. 그 메인 컴포넌트 안에서만 쓰이거나 작은 단위로 export되는 하위 서브
     컴포넌트

  `function`/`const` 선언은 호이스팅되어 실제 렌더 시점엔 이미 초기화가
  끝나 있으므로 순서를 바꿔도 동작에는 영향이 없습니다.

- 주석은 WHY(비직관적인 이유·제약·트레이드오프)만 남기고 최대한 간결하게
  씁니다 — 배경 설명을 줄이고 핵심만 남깁니다.

## 곡 데이터

`guide` 기능(가이드 가사/응원법)과 `zutopia` 기능(곡/앨범 DB)은 서로 다른
데이터 소스를 씁니다 — 섞어서 참조하지 마세요.

### guide: 정적 파일 (가이드 콘텐츠)

- 곡 하나당 파일 하나 (`src/features/guide/data/songs/<번호>_<song-id>.ts`),
  `Song` 객체를 default export. 파일명 앞의 두 자리 번호는 목록에 표시되는
  순서(셋리스트 순서)를 나타내며, `Song.id` 값 자체에는 포함하지 않습니다
  (예: 파일 `01_byoushinwo-kamu.ts` → `id: "byoushinwo-kamu"`).
- `src/features/guide/data/songs/index.ts`가 모든 곡을 모아 `songList` 배열과
  `getSong(id)`를 제공.
- 새 곡 추가 시: 다음 번호로 파일 하나 만들고 `index.ts`에 import + `songList`
  배열 항목 추가.
- 곡 제목 폰트(851MkPOP)는 제목에 쓰인 글자만 담은 서브셋인데, dev·build가
  시작할 때 자동으로 다시 만들어지므로 곡을 추가해도 따로 할 일은 없습니다.
  개발 서버를 켠 채 추가했다면 `pnpm fonts:subset`을 실행해야(재시작 불필요) 새
  제목의 한자가 제 폰트로 보입니다. 제목을 `jp: "…"` 문자열이 아닌 형태로 적어
  글자가 빠지면 `pnpm build`가 끝에서 에러로 알려 줍니다(`docs/RULES.md`의 폰트
  서브셋 항목).
- 스윙 동작 예시 애니메이션이 있는 곡은 `public/assets/guide/<song-id>.webp`를
  두고(원본 크기 그대로 표시, GIF는 용량이 커서 애니메이션 WebP로 변환해서 넣음) `Song.swingGif`에 경로를 적습니다. 응원 가이드(/guide)에서만 표시되며
  (`SwingGuideGif.tsx`) 현재 가사 줄에 `swingGif: true`(`LyricLine` 플래그)가 있을
  때만 뜹니다 — 모바일은 화면 우측 중앙에 고정, tablet 이상은 가사 영역 우측에서
  재생 중인 줄의 바로 윗줄 세로 가운데(가사 스크롤을 따라 움직임, `LyricsView`). GIF 경로는 음원 버전에서도 정식(live) 데이터의 값을 씁니다.
  `swingGif: true` 줄이 연달아 붙은 구간에 들어갈 때마다 애니메이션을 첫 프레임부터
  다시 재생합니다(노래 박자와 맞추기 위함).
  `swingGif`에 경로를 배열로 여러 개 적으면 하나가 한 바퀴 끝날 때마다 다음 것으로
  번갈아 재생합니다(한 바퀴 길이는 애니메이션 WebP의 프레임 시간을 읽어서 계산하므로
  WebP로 넣어야 함. 예: 해마성장통). 화면엔 작게(보통 100~120px) 뜨므로 원본을
  그대로 넣지 말고 표시 크기의 2배 정도로 줄이고, 프레임이 많으면 솎아 냅니다.
  원본 비율이 정사각형이 아니면 `Song.swingGifSize`(px)를 지정해 파일은 그대로 두고
  화면에서만 그 크기 정사각형에 맞춰 가운데 부분만 보이게 할 수 있습니다
  (예: 400x200 → `swingGifSize: 100`이면 가운데 200x200이 100x100으로 표시).
- `data/not-yet/`은 아직 가이드가 준비되지 않은 곡, `data/origin/`은 수정 전
  원본 가사/정보 백업 — 둘 다 `songList`에는 포함되지 않습니다.

### zutopia: Supabase DB (곡/앨범/공연 데이터베이스)

- `/zutopia/songs`, `/zutopia/albums`에서 보여주는 곡·앨범 목록과 `/zutopia/lives`의
  지난 공연·세트리스트 목록은 정적 파일이 아니라 Supabase(`songs`/`albums`/
  `lives`/`setlists` 테이블)에서 빌드 타임에 가져옵니다
  (`song-db/data.ts`, `lives/data.ts` → `createBuildTimeSupabaseClient()`).
- 이 클라이언트는 서버 컴포넌트 최상위(`page.tsx`)에서만 호출해야 합니다 —
  `output: "export"`(정적 export) 빌드라 런타임 서버가 없고, 클라이언트
  컴포넌트로 전달할 수 없습니다. 자세한 제약은
  `docs/RULES.md`의 관련 항목을 참고하세요.

## 가사 타이밍

- `LyricLine.time`은 `"mm:ss"` 또는 `"mm:ss.s"` 문자열(`Timestamp` 타입)입니다. 초 단위
  숫자가 아닙니다.
- 유튜브 재생 화면에 뜨는 시각을 그대로 옮겨 적으면 됩니다. 반 박자 정밀도가 필요하면
  소수점을 추가합니다 (예: `"1:05.5"`).

## 가사 필드

- `original` / `pronunciation` / `translation` — 특정 언어 종속 이름(jp/ko/tr 등) 대신
  일반화된 필드명을 씁니다.
- `pronunciation`은 문자열 또는 `{ text, tag }[]`(`LyricSegment[]`)로 구간별 응원
  타입(색상)을 지정할 수 있습니다. `cheer`는 그 줄 전체에 대한 응원 문구로, 문자열 또는
  단일 `{ text, tag }`를 받습니다.
- `tag`(`CallTag`)는 `"swing" | "clap" | "call" | "dance"` 중 하나입니다. 응원 설명
  없이 태그만 달려면 `cheer: { text: "", tag: "dance" }`처럼 `text`를 비웁니다
  (예: 곡 전체를 춤추며 즐기는 해마성장통).
- 가사 텍스트(`original`/`pronunciation`) 안에 `[swing]` `[clap]` `[call]` 토큰을 그대로
  적으면 해당 위치에 아이콘이 렌더링됩니다 (`src/lib/guide/icon-tokens.ts`).
- `claps`(선택)는 `pronunciation` 속 ✋의 박수 타이밍입니다(✋는 따라 부르는 발음 줄에
  적고, 응원 단어처럼 `**…**`로 감싸면 형광펜도 함께 칠해집니다). **그 줄 `time`으로부터 몇 초
  뒤인지**를 숫자 배열로 적고, ✋를 앞에서부터 순서대로 하나씩 대응합니다
  (예: `time: "3:40.7"`, `claps: [1.4, 2.2, 2.4]` → 3:42.1, 3:42.9, 3:43.1).
  재생 중인 줄에서만 동작하며, 칠 차례가 아닌 ✋는 흐리게, 타이밍이 된 ✋는 튀어
  오르며 같은 ✋ 잔상이 커지며 사라지고, 그때마다 가사 줄 배경이 박수 색으로 울립니다
  (`ClapText.tsx`의 `pulseLine`, Web Animations API로 줄 요소에 직접 재생). 개수가 모자라면 남는 ✋는 그냥 표시됩니다.
  ✋ 사이 간격은 표기로 정합니다: 붙여 쓰면(`✋✋`) 간격 없음, 띄어쓰기는 0.4em,
  슬래시(`/`)는 1em(슬래시 문자는 화면에 안 보임). 예: `✋ ✋✋/✋ ✋✋`. 첫 ✋
  앞은 0.5em 더 띄웁니다.
  이 규칙은 `claps`가 없는 줄의 ✋에도 똑같이 적용됩니다.
  재생 위치는 250ms 간격 `currentTime`이 아니라 `usePlayer().getCurrentTime()`을 매
  프레임 읽고 그 사이를 추정해 맞춥니다.

## Tailwind

- 글자 크기: 읽거나 누르는 글자(버튼, 칩, 라벨, 설명, 배지)는 `text-sm`(14px)부터.
  `text-xs`(12px)는 개수·시각 같은 보조 정보에만, `text-[10px]`은 쓰지 않습니다.
  예외: 푸터의 건의·출처 버튼은 푸터를 컴팩트하게 유지하려고 `text-xs`를 씁니다.
- 디자인 방향은 모던·심플: 버튼은 모서리가 살짝 둥근 사각형(`rounded-lg`), 상태는 단색
  면과 테두리로만 구분합니다. **알약 모양, 그라데이션 채움, 한쪽 면만 강조하는 막대
  (왼쪽 띠·밑줄 띠 등)는 쓰지 않습니다** — 선택 상태도 칸 전체의 면으로 표시합니다.
  예외: 홈 NEXT VISIT/NEXT STAGE의 날짜·장소 티켓 카드는 콘서트 티켓 모양을 살리려고
  위쪽 그라데이션 띠(내한/원정 색)를 유지합니다.
- 버튼은 성격에 따라 `src/components/button-styles.ts`의 공용 스타일을 씁니다
  (크기·위치는 호출부에서 `cn`으로 얹기):
  - 이동(뒤로가기·메인으로·가이드 곡 이동, 설치·공유, 푸터 건의·출처):
    `NAV_BUTTON_CLASS` — 어두운 면 + 2px 테두리
  - 고르기(공연 정보 탭, 즛토피아 곡/앨범, 가이드 곡 목록 필터): `TAB_LIST_CLASS` 안에
    `TAB_CLASS`, 고른 칸은 `ACTIVE_TAB_CLASS`(흰 면으로 반전)
  - 링크(다른 페이지·구역으로 이동하는 글자 버튼): `LINK_BUTTON_CLASS` — 투명 면 + 2px
    테두리, 필요하면 끝에 화살표 아이콘
  - 동작(모바일 설치 배너의 "추가"처럼 눌러서 실행): `ACTION_BUTTON_CLASS` — 사이트
    대표색(마젠타) 단색 면
  - 닫기 같은 테두리 없는 아이콘 버튼: `GHOST_ICON_BUTTON_CLASS`
  - 목록의 한 줄(가이드 곡 목록·곡 목록 드로어): `LIST_ITEM_CLASS`, 고른 줄은
    `ACTIVE_LIST_ITEM_CLASS`(줄 전체를 옅게 칠함)
  - 포커스 표시는 `FOCUS_RING`을 씁니다(위 상수들에는 이미 들어 있음).

- 커스텀 브레이크포인트: `tablet`(50rem/800px) / `pc`(67.5rem/1280px) / `wide`(90rem/1440px).
  전부 min-width 기준이며 `src/app/globals.css`의 `@theme`에서 정의합니다. 뷰포트
  **높이**가 낮은 경우를 위한 커스텀 variant `short`(max-height: 880px) / `low`(800px) /
  `xlow`(700px)도 있습니다(겹치면 뒤에 선언된 쪽이 이기도록 이 순서로 선언).
  모바일 화면에 영향을 주지 않으려면 `tablet:xlow:`처럼 너비 variant와 함께 씁니다.
- 사이트 전용 색상은 `ztmy-dark` / `ztmy-purple` / `ztmy-magenta` / `ztmy-pink` 토큰을
  씁니다 (`globals.css`에 정의). 하드코딩된 hex(`bg-[#8d3cd4]` 등)를 새로 추가하지
  마세요 — 이미 있는 값이라면 토큰이 없는지 먼저 확인합니다.
- `tablet:` / `pc:` / `wide:` 같은 반응형 variant는 베이스 클래스와 한 문자열에 섞지 않고,
  `clsx()`의 별도 인자(별도 줄)로 분리합니다. 조건부 분기가 없어도 반응형 클래스가
  섞이는 순간 `clsx()`를 도입합니다.

  ```tsx
  // Bad
  className="flex items-center gap-2 tablet:gap-4"

  // Good
  className={clsx(
    "flex items-center gap-2",
    "tablet:gap-4",
  )}
  ```

- `pnpm format` (Prettier + `prettier-plugin-tailwindcss`)이 클래스 순서를 자동
  정렬합니다. 커밋 전에 한 번 돌리는 걸 권장합니다.

## 정적 에셋

- 컴포넌트가 참조하는 정적 에셋은 `public/assets/<feature>/...` 경로 컨벤션을
  따릅니다 (예: `public/assets/notice/festival/*.webp`). `/assets` 접두사를
  빠뜨리면 404가 납니다.
- 배경 이미지는 `public/backgrounds/`, PWA/매니페스트 아이콘은 `public/icons/`,
  Open Graph 이미지는 `public/og/`에 둡니다. 폰트는 `public/`이 아니라 원본을
  `src/fonts/`에 두고, `scripts/subset-fonts.mjs`가 만든 `src/fonts/subset/`
  파일을 `next/font/local`로 로드합니다.

## 페이지 스크롤 레이아웃 + Footer

- 앱 셸(`body`)은 스크롤되지 않는 고정 레이아웃입니다(`docs/RULES.md` 참고).
  자기 `<main>`에서 직접 스크롤을 여는 페이지(`/info`, `/credits`,
  `/zutopia`)는 안쪽 레이아웃을 직접 짜지 말고 `src/components/PageScrollBody.tsx`를
  씁니다 — 콘텐츠가 짧으면 Footer가 화면 하단에 고정되고 길어지면 밀려나는
  동작을 한 곳에서 관리합니다.
- `PageScrollBody`는 내부적으로 `<Footer inline />`을 렌더링합니다. 루트 레이아웃의
  Footer는 메인 화면(/)에서만 그리므로, 새 스크롤 페이지가 이걸 쓰기 시작해도 따로
  등록할 곳은 없습니다. 가이드·슬램 화면엔 푸터가 없습니다(목록·가사가 화면 높이를
  다 씀).
- 푸터(`src/components/Footer.tsx`)는 배경 띠·경계선 없이 글자 그림자만 준 한 줄입니다.
  - 태블릿 이상(메인 화면에서만 보임): 왼쪽에 운영자가 정한 저작권 문구 그대로
    (`lib/seo.ts`의 `COPYRIGHT_NOTICE`), 오른쪽에 사이트 기능 버튼 묶음
    [설치][공유] | [건의][출처]. 설치(`InstallButton`)는 설치 가능할 때만 보입니다.
    화면 높이가 700px 이하면 홈 카드들과 겹쳐서 숨깁니다(`tablet:xlow:hidden`).
  - 모바일: 줄인 문구("비공식 팬 페이지 · © ZUTOMAYO · 출처" — 출처는 글자 링크) +
    건의 버튼. 저작권 전문은 출처 페이지(/credits)에도 있습니다.
- 공유(`ShareButton`, `lib/use-share.ts`)는 지금 보고 있는 페이지 주소를 보냅니다.
  자리: PC 메인 푸터, 가이드·슬램 곡 상세의 PC 상단 막대(`GuideDetailToolbar`),
  모바일 상단 바(메인과 곡 상세).
- 공식 링크 아이콘(`data/social-links.ts`의 `OFFICIAL_ICON_LINKS` — zutomayocalendar.net
  푸터와 같은 유튜브, X 메인·스태프, 인스타그램 메인·스태프·mart, 아이콘도 같은
  이미지를 `public/assets/footer/`에 두고 그대로 씀)은 PC 메인 오른쪽 위
  (`features/home OfficialLinks`), 모바일은 메인 상단 바 왼쪽 버튼이 여는 시트
  (`components/mobile/OfficialLinksSheet`, 아이콘만으론 계정 구분이 안 돼서 이름 포함)에
  있습니다.
- 건의 폼(Tally) 주소는 `lib/feedback.ts`의 `getFeedbackUrl()`로 만듭니다. 곡 가사
  맨 끝의 "이 곡 싱크·가사 오류 제보"는 `title`(곡 한국어 제목)·`mode`(cheer/slam)를 넘기는데,
  Tally 폼에 같은 이름의 숨김 필드(Hidden fields)가 있어야 값이 채워집니다.

- 메인에서 들어올 때 내용이 서서히 나타나게 하려면 `src/components/EntranceFade.tsx`로
  감쌉니다(/info, /zutopia). /guide의 패널과 같은 훅(`src/lib/use-entrance-visible.ts`)을
  써서 배경이 어두워지는 타이밍과 맞습니다. 하위 페이지를 오갈 때 다시 재생되지
  않게 하려면 페이지가 아니라 레이아웃 쪽에 둡니다.

## PWA 설치 프롬프트

- `beforeinstallprompt`/`appinstalled` 구독 로직은 `src/lib/use-install-prompt.ts`의
  `useInstallPrompt()` 하나로 관리합니다. PC 푸터 설치 버튼(`InstallButton`)과
  모바일 배너(`InstallPromptBanner`)는 UI만 다르고 이 배관은 공유합니다 —
  새로 설치 유도 UI를 추가해도 이 이벤트 구독을 다시 만들지 말고 훅을
  재사용하세요.
- iOS Safari는 `beforeinstallprompt` 자체를 지원하지 않아 프로그래밍적으로
  설치를 띄울 방법이 없습니다 — iOS에서는 "공유 버튼 → 홈 화면에 추가"
  안내 텍스트로 대체해야 합니다(`isIos()` 판별 필요, iPadOS 13+는 데스크톱
  Safari와 동일한 UA를 보내 `navigator.platform === "MacIntel" &&
navigator.maxTouchPoints > 1` 조합으로만 구분 가능 — `navigator.platform`이
  타입 정의상 deprecated로 뜨지만 이 용도엔 대안이 없어 의도된 사용입니다).

## 브라우저 API 기반 초기 상태

- `Date.now()`, `navigator.*`, `localStorage` 등 클라이언트에서만 확정되는
  값을 `useState`의 초기값으로 직접 계산하면 안 됩니다 — 이 사이트는
  `output: "export"`라 HTML이 빌드 시점에 고정되는데, 빌드 이후 그 값이
  달라진 채로 하이드레이션하면 서버(빌드 시점) 렌더와 클라이언트 렌더가
  달라져 hydration mismatch가 납니다. 항상 시간/환경과 무관한 고정값으로
  초기화하고, `useEffect` 안에서 한 번 보정하세요(예:
  `page.tsx`의 `getInitialTabletOpenAccent`, `InstallPromptBanner`의
  iOS/dismissed 판별).
- 이 패턴은 `react-hooks/set-state-in-effect` 린트 규칙과 충돌합니다(effect
  본문에서 직접 `setState`를 부르지 말라는 규칙) — 위 사유로 불가피한
  경우, 이유를 적은 `// eslint-disable-next-line react-hooks/set-state-in-effect --
...` 주석과 함께 예외 처리하세요.

## Git / 커밋

- Conventional Commits 접두사를 사용합니다 (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `style:` 등). 곡 가사/응원법 데이터만 바꾸는 커밋은 `song:` 접두사를
  씁니다.
- 관심사 단위로 잘게 나눠서 커밋합니다 (파일/기능 하나당 커밋 하나를 지향).
