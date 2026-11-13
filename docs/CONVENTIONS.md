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
                             # (면·테두리 없는 GHOST_BUTTON_CLASS — 곡 목록 드로어
                             # SongListDrawer / 공유 / 이전 곡 │ 다음 <곡 제목>.
                             # 목록으로 돌아가기는 헤더 ‹), 영상 아래 CallLegend
                             # (응원 표시 안내 — 누르는 기능이 없어 아이콘+이름만,
                             # 박스 없음), 그 아래 SongDescriptionPanel
                             # (Song.description, 없거나 비면 칸을 숨김 — 모바일은
                             # 가사 목록 맨 위 카드로 보여 주고, 재생 중인 줄
                             # 순번은 그 카드만큼 보정한다(LyricsView)), 둘의
                             # 오른쪽에 동작 예시 GIF 칸(SwingGuideGifSlot).
                             # 곡 상세에선 영상 영역이 위쪽 정렬(목록 화면의
                             # 공지는 가운데 정렬 그대로 — GuideMainScrollArea).
                             # 자동 스크롤 토글은 가사 영역 오른쪽 아래. 곡별
                             # 싱크·가사 오류 제보(SongReportLink)는 PC는 가사
                             # 영역 왼쪽 아래 어두운 면 버튼(floating), 모바일은
                             # 영상 아래 줄 오른쪽 사이렌 아이콘 버튼(inline,
                             # SirenIcon — "문제 알리기"). 음원/라이브 전환
                             # (SongVersionToggle — `음원 (●━━) 라이브` 스위치,
                             # 고른 쪽 글자 분홍)은 영상을 바꾸는 기능이라 영상
                             # 쪽에 둔다 — PC는 영상 위 버튼 줄 곡 목록 옆, 모바일은
                             # 영상 아래 줄 오른쪽(오류 제보 앞). 음원 버전(origin)
                             # 데이터가 있는 곡만 보인다.
                             # 모바일 곡 상세: 상단 바 가운데에 곡 제목
                             # (MobileSongTitle — 전역 MobileHeader가 곡 데이터를
                             # 안 불러오도록 가이드 layout이 겹쳐 그리고, 헤더는
                             # 로고를 비움), 본문의 선택된 곡 줄은 숨김. 영상
                             # 아래 한 줄에 작은 응원 표시 안내(CallLegend
                             # compact) + 오류 제보. 모바일은 목록 ↔ 곡 상세 전환
                             # 애니메이션(곡 줄 접힘·영상 펼침)이 없고 가사
                             # fade만 남긴다. 목록으로 돌아오면 보던 스크롤 위치로
                             # 복원(GuideListScroll).
                             # 곡 목록 필터(SongFilterBar)는 필터 칩 전용 스타일,
                             # 모바일은 줄마다 한 줄 가로 스크롤. 이 세로 열의
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
                             # 응원 설명 앞엔 응원 종류 이름("흔들기" 등)을 붙이지
                             # 않는다(왼쪽 아이콘·글자 색이 이미 알려줌).
                             # 가사 줄은 [아이콘 칸 | 본문] 두 칸 그리드라 아이콘이
                             # 본문 첫 줄(응원 설명/원문) 세로 가운데에 맞고, 응원
                             # 태그가 이어지는 구간은 첫 줄에 아이콘 + 아래로
                             # 응원 색 세로선(lib/line-tag.ts getTagRunPositions,
                             # LyricLine RunLine/GutterMarker). ♫만 있는 간주 줄은
                             # 구분선 ── ♫ ── (MusicBreak, 응원 아이콘은 음표
                             # 옆), 재생 중엔 ♪♫♪가 박자 타듯 들썩이고 구분선이
                             # 분홍빛으로 밝아지며, 응원 아이콘도 줄 왼쪽 아이콘과
                             # 같은 응원별 애니메이션을 한다(MusicBreakIcon). 글자가 있는 간주(밴드 소개
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
                             # PC: 왼쪽 위 로고(h1)+소개 문구(Header), 왼쪽 공연 카드
                             # (NextEventCard) + 원정 카드 아래 공연 안내 버튼
                             # (ConcertQuickPanel, 패널은 오른쪽으로 열림), 오른쪽
                             # 메뉴(MainNavLink) + 곡
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
                             # 모바일: 상단 바 [로고 | 공유] →
                             # 소개 문구 → 메뉴 → 곡 바로가기 → 공연 카드 →
                             # 공연 안내 → 푸터. 360×640에서도
                             # 넘치지 않게 맞춰 두었으니 세로로 뭔가 더하면
                             # 그 크기에서 확인한다.
    info/                   # /info 페이지 콘텐츠 (info.mdx + 렌더 컴포넌트).
                             # 탭(공연/축제/콜라보/팝업) 소속은 info.tsx의
                             # INFO_TABS/INFO_TAB_SECTIONS 하나로만 관리하고
                             # (섹션 쪽엔 안 붙임 — 섹션 하나가 여러 탭에
                             # 동시에 속할 수 있어서), InfoTabs/TabSection/
                             # lib/use-info-tab.ts가 이를 읽어 렌더링한다.
                             # 탭 바(InfoTabs)는 본문이 아니라 헤더(SiteHeader)에
                             # 있다 — 탭을 바꾸면 본문의 탭 내용 시작점
                             # (INFO_TAB_ANCHOR_ID)으로 스크롤한다.
                             # 열린 탭은 주소 해시(/info#popup)에 두어 새로고침·
                             # 링크 공유에도 유지된다(탭 id = 해시).
                             # 공연 목록(SCHEDULE_SHOWS)과 공연별 당일 시간표
                             # (getShowSchedule — 개장 = 개연 1시간 전)는
                             # schedule.ts 한 곳에 둔다. lib/schedule-status.ts가
                             # 다음(또는 오늘) 공연과 당일 진행 상태를 현지 일본
                             # 시각으로 계산한다. 공연 관련 링크 모음은 links.ts.
                             # 투어 전체 일정(data/tour-schedule.ts)은
                             # TourScheduleTable 표(날짜 / 도시 / 장소 / 인원수,
                             # 월 구분 줄) 하나로 /info 일정 탭과 홈 공연 안내
                             # 패널이 같이 쓴다. 홈 패널은 시기별로 바뀐다:
                             # 다음 공연 3일 이내(당일 포함)면 그 공연 시간표
                             # (ScheduleTimeline, 당일엔 지금 일정 강조), 티켓
                             # 접수가 아직 진행 중이면(입금 기간까지) 접수 일정
                             # (TicketRoundList, 접수 중·입금 중 회차 강조,
                             # 끝나지 않은 회차는 당락·입금 기간도 표시, 접수·
                             # 입금 중 회차는 신청/당락 확인·지불 링크) +
                             # 접힌 투어 일정표, 접수가 끝나면 투어 일정표를
                             # 항상 펼치고 다음 공연 줄 강조·지난 공연은 접음.
                             # DetailField/DetailList(라벨: 값 카드)는
                             # 티켓/굿즈 안내처럼 반복되는 목록에 재사용한다.
                             # ImageGallery는 이미지 묶음을 태블릿 이상에선
                             # 그리드로, 모바일에선 세로(stack) 또는 가로 넘김
                             # (swipe, 장수가 많을 때)으로 보여주고 어느 걸 눌러도
                             # 같은 확대 뷰에서 묶음 전체를 넘겨 본다.
    notice/                 # 공지사항 (MDX 콘텐츠 + 데이터 + 노출/해제 로직)
                             # 화면별 목록은 data/index.ts의 getNoticesForMode
                             # (슬램 가이드 = isSlamVisible, 응원 가이드 = 그 외).
                             # isAlwaysOpen(처음에 펼쳐 둘 공지)은 화면마다
                             # 하나씩 — 같은 화면에 둘 이상이면 개발 중 경고.
      content/              # 공지 MDX 프로즈
    zutopia/                 # 즛토피아 허브: 카테고리→항목 2단 구조(registry.ts) +
                             # 곡/앨범 DB(song-db/) + 지난 공연 DB(lives/) — 전부
                             # Supabase 기반(아래 "곡 데이터" 참고).
                             # 첫 화면 카드는 두 묶음을 세로로: 아카이브(디스코
                             # 그래피·공연·활동 연혁·통계·블루레이·콜라보) /
                             # 플레이그라운드(라이브 참전 기록·퀴즈·퀴즈 통계).
                             # 한 줄 모바일·태블릿 2장, PC 4장 고정. 준비 중 카드는
                             # ZutopiaHubCard에 href={null}. href가 http(s) 바깥
                             # 주소면 새 창으로 연다(콜라보 → 공식 사이트 콜라보
                             # 페이지, 그림 public/assets/zutopia/components/collabo.webp). 카드엔 제목 + 한 줄
                             # 정보(meta, 넘치면 말줄임)만 — 모바일 카드 폭(약
                             # 150px)에 들어가게 짧게 쓴다.
                             # 통계·참전 기록 맨 위엔 늘 보이는 "데이터 추가 중!"
                             # 안내(components/DataInProgressNotice) — 세트리스트를
                             # 다 채우면 두 페이지에서 뺀다.
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
                             # 공연 일정(TourDateList.tsx)에서 행을 누르면 그 행
                             # 바로 아래에 그 공연의 이미지·세트리스트를 펼친다
                             # (아코디언, 한 번에 하나). 이미지는 공연 상세와 같은
                             # 방식 — 포스터는 크게, 아이콘(포스터와 다를 때)·추가
                             # 이미지는 작은 목록. 행은 썸네일 중심 — 왼쪽에
                             # 아이콘(없으면 포스터)을 3:4로 크게, 날짜는 그림
                             # 아래쪽에 얹고, 그림이 없으면 같은 폭의 날짜 칸.
                             # 취소된 공연(lives.status = 'CANCELED')은 투어 일정과
                             # 공연 목록(getCanceledLiveEntries, 목록 화면만)에
                             # 회색 + 빨간 취소선(lives/surface.ts CANCELED_TEXT_CLASS)
                             # + "공연 취소" 태그로, 누를 수 없다. 상세·사이트맵·
                             # 검색·참전·통계는 ACTIVE만, 공연 수에서도 뺀다. 행 안엔 그날의 선택곡이 미리 보이고, 공통
                             # 곡은 위 "투어 공통 세트리스트"(TourCommonSetlist,
                             # TourDetail.setlist)에 한 번만 둔다 — 처음엔 펼침,
                             # 제목 줄로 접기. 공연일마다 다른 곡이 들어가는
                             # 번호엔 "선택곡" 줄(그 자리에 들어간 곡마다 불린
                             # 도시·일차, 예: "서울 DAY 1")을, 그날 어느 공통 곡
                             # 바로 뒤에 불렸는지로 자리를 정해(공연일 번호가
                             # 밀려도 앞뒤 순서 유지) 공통 곡 사이 빈 번호에,
                             # 빈 번호가 없으면 "15-1"처럼 번호를 붙여
                             # 끼운다. 티켓·세트리스트·공연일 행은 배경 위에서
                             # 읽히게 lives/surface.ts의 어두운 카드 면을 쓴다.
                             # 선택곡·DAY 1·DAY 2·ENCORE·내한 태그는 surface.ts의
                             # LIVE_TAG_CLASS/LIVE_TAG_TONE(알약·테두리 없는 옅은
                             # 면, 가이드 중요도 배지와 같은 결).
                             # 투어 공연일 세트리스트는 투어 공통 곡
                             # (setlists.tour_id) + 그 공연일 곡(setlists.live_id)을
                             # track_number로 합치고, 공연일에만 있는 곡은
                             # "선택곡"(ztmy-sky 행 배경·태그, 앙코르는 ztmy-sun)으로
                             # 강조한다. 일차(day_number)가 있는 곡은 "DAY 1"(분홍)·
                             # "DAY 2"(보라) 배지로 일차를 표시한다(모든 날 같은 선택곡은
                             # 일차 없이 "선택곡"만).
                             # 같은 곡이 투어 공통·공연일 양쪽에 있으면 공통 곡으로
                             # 한 번만, 번호는 공연일 쪽(그날의 실제 순서)을 따른다
                             # (data.ts mergeTourSetlist — 공연일 세트리스트를 전부
                             # 등록한 경우 번호가 겹치지 않게). 이틀 공연을 날마다
                             # 통째로 등록했으면 공통 곡은 한 줄로 합치고(번호는
                             # 가장 많이 쓰인 것) 선택곡만 날짜별로 남긴다
                             # (collapseRepeatedDays).
                             # lives/tours.metadata.visited("first"/"second"…)가
                             # 있으면 내한 공연 — visit.ts가 파싱하고, 상세는
                             # 티켓(LiveTicket) 맨 위 줄 공연 종류 바로 옆 VisitBadge(
                             # 공연 종류 LiveTypeBadge — 점 + CONCERT 등 영문),
                             # 목록 카드는 마젠타 테두리 + 그림 위 같은 태그로
                             # 강조한다(둘 다 LIVE_TAG 모양, 알약 없음). 내한 색은
                             # 홈의 내한 색과 같은 마젠타(노랑은 ENCORE 전용).
                             # 공연 종류는 투어(tours)·페스티벌(FESTIVAL)·콘서트
                             # (그 밖의 모든 lives.type) 세 가지 — types.ts의
                             # ZutopiaEntryType/ENTRY_TYPE_DOT을 목록 필터·카드·
                             # 통계·티켓 배지가 같이 쓴다(허브 카드 요약만 투어 /
                             # 그 밖 공연 두 덩어리로 센다)(투어 하늘, 페스티벌
                             # 보라, 콘서트 분홍). 목록 카드는 그림 왼쪽 위에 종류
                             # 태그(종류 색으로 꽉 찬 면) → 내한 태그 순으로 얹고,
                             # 그림 아래 글자는 원제·한글 제목·날짜·도시 세 줄.
                             # 목록은 카드/리스트 보기를 전환할 수 있고
                             # (useListViewMode — localStorage, 정적 HTML은 항상
                             # 카드), 리스트 보기는 작은 썸네일 + 오른쪽 태그 한 줄.
                             # 필터는 곡·앨범과 같은 FilterPanel + SortFilterBar
                             # 줄(형식·연도·정렬·보기). 형식 칩은 종류 색 점·개수,
                             # 고르면 종류 색, 해당 없는 칩은 disabled. 필터를 건
                             # 동안만 카드 오른쪽 위(summary)에 필터 초기화 — 곡·
                             # 앨범·공연·통계 모두 합계 개수는 따로 두지 않는다.
                             # 연혁(종류 켜고 끄기)도 같은 FilterPanel. 참전 기록의
                             # 성불/성불 대기는 필터가 아니라 목록 카드 머리의 두
                             # 칸 탭(이름 + 큰 숫자, 정렬 설명·마지막 라이브 버튼).
                             # 곡 수는 탭에만 두고 위 현황 막대는 참전 횟수·성불률만
                             # (같은 숫자가 두 번 보이지 않게).
                             # 성불한 곡의 들은 공연일은 행 밑 Popover(한 번에 하나,
                             # 목록 배치를 바꾸지 않게 카드에 overflow-hidden 금지).
                             # 카드 면은 zutopia/surface.ts의 ZUTOPIA_SURFACE_CLASS
                             # (어두운 면, 순수 모듈) — 필터 카드·참전 현황 막대·
                             # 목록 카드·통계 카드가 같이 쓴다.
                             # 공연 상세는 PC에서 max-w-4xl(목록 1440px과 폭 차이
                             # 완화).
                             # 화면 전환: 다른 페이지와 같이 내용이 서서히 나타난다
                             # (ZutopiaScrollArea가 경로가 바뀔 때마다 EntranceFade의
                             # replayKey를 바꿈). 공연 목록↔상세(isPosterHop)만 키를
                             # 그대로 둬서 건너뛰고(상세→상세는 페이드), 그 사이엔 공연
                             # 그림↔상세 포스터가 posterTransitionName(View
                             # Transition share="morph")으로 이어진다. 스타일은
                             # globals.css(.morph, 동작 줄이기면 끔).
                             # 필터 결과·드로어 내용은 key + .animate-content-in.
                             # 하루 여러 회차: 날마다 회차 수 = lives.metadata.shows에
                             # 적힌 회차 · 그날 세트리스트 show_number 중 큰 쪽(2회
                             # 이상일 때만, 이름 없으면 "N회차"). metadata.shows는 이름
                             # 배열(매일 같음) 또는 [{day, show, label, show_open, show_start}]
                             # (날마다 다르게, 시각 show_open·show_start "HH:MM") — lives/shows.ts.
                             # setlists.show_number는 1부터, 비면 그날 모든 회차. 공연일 = 날짜 × 회차, 체크 키는 첫 회차 "id:날짜",
                             # 둘째부터 "id:날짜:2"(예전 체크 유지). 공유 코드는 첫
                             # 회차들이 앞 비트, 둘째 회차부터 그 뒤(예전 코드 호환).
                             # 표기는 lives/shows.ts의 formatDayShow("DAY 1 昼の部").
                             # 세트리스트 메모 setlists.note: arrange(편곡)·info(덧붙임,
                             # "Short ver.")는 곡 아래 한 줄(" · "로 이음) — info가
                             # "Live debut"면 대신 제목 앞 마젠타 "[첫 공개]",
                             # info에 "cover"가 들어가면 제목 앞 하늘색 "[커버송]".
                             # 커버곡 행은 song_id 없이 note.title·title_kr(제목 오른쪽 괄호)·original_artist —
                             # lives/data.ts normalizeSetlistRows가 가짜 곡(id
                             # "cover:제목")으로 바꾸고, 라이브 기록·통계·검색은 곡이
                             # 연결된 행만 센다.
                             # variation(코너 이름)은 같은 줄 맨 앞에 값 그대로 + " ver.".
                             # 미공개곡(songs.metadata.unrelease)은 "미공개" 태그
                             # (LIVE_TAG_TONE.unreleased, 흰 계열 — DAY·선택곡·
                             # ENCORE 색과 겹치지 않게).
                             # 이틀 이상 단독 공연(투어·페스티벌·출연일 있는 공연
                             # 제외)은 live-days.ts의 splitLiveDays로 투어 상세와
                             # 같은 모양 — 모든 날 부른 곡 = 공통 세트리스트
                             # (TourCommonSetlist, 번호는 첫날), 날마다 공연 일정 한
                             # 줄(LiveSchedule, DAY 태그), 그날만 부른 곡은 선택곡.
                             # 온라인 공연(region·live_venue = "online")은 lives/region.ts의
                             # ONLINE_LABEL("온라인 라이브")로 — splitRegion·displayVenue가
                             # 바꿔 주고, 티켓은 Region 칸·지도 링크를 뺀다. 공연 목록
                             # 카드는 도시 글자 없이 그림 위 해(sun) 색 "온라인" 태그(entry.online) —
                             # 종류 태그(콘서트·페스티벌) 대신. 목록 필터 "온라인: 제외" 칩.
                             # 필터 카드는 거르기(형식·연도·온라인 — 결과 수가 바뀜,
                             # 필터 초기화 대상)와 보여주기(정렬·보기)를 선으로 나눈다. 공연일(LiveUnit.online)은 live-history의
                             # inPersonUnits로 걸러 참전 기록·통계엔 현장 공연만 —
                             # 곡별 라이브 횟수·마지막 라이브는 온라인도 세고, 연혁은
                             # 온라인 공연을 그리되 공연 횟수엔 넣지 않는다.
                             # 티켓 Official 줄 = lives.official_url(도메인 링크, 새 탭 —
                             # tours엔 컬럼 없음).
                             # 티켓 metadata: variation(Variation 줄), spotify·
                             # youtube_music·apple_music(Listen 줄), twit(Post 줄, X
                             # 아이콘 — 흰 면 + 검은 로고) — live-metadata.ts.
                             # 티켓 장소(Venue) 칸은 날짜·지역 아래 전체 폭 한 줄
                             # (줄바꿈 없음), lives.venue_url이 있으면 지도 링크.
                             # 공연별 수동 콘텐츠가 필요하면 lives/<슬러그>/
                             # content.mdx를 만들어 [slug]/page.tsx의
                             # CONTENT_BY_KEY에 등록한다(선택 사항).
      song-db/              # 곡/앨범 DB 조회·정렬·표시 로직 (Supabase 소스)
                             # 곡 목록 정렬: 앨범·발매일·편곡(arranger)·MV 감독
                             # (movie_director) — 사람별 묶음은 groupSongs의 groupByPeople
                             # (여럿이면 각자 묶음, 곡 많은 순, "정보 없음" 맨 뒤).
                             # 필터 "MV: 있는 곡만"(music_video_url) 켜고 끄는 칩,
                             # "협업: 협업곡 빼기"(metadata.collab — 피처링·트리뷰트·
                             # 타이업 등 직접 발표하지 않은 곡, 기본은 보여 주고
                             # 목록·상세에 "협업" 칩, 상세 표에 출처 문구).
                             # 목록 위 정렬/필터 카드는 모두 components/SortFilterBar.tsx의
                             # FilterPanel — filters(무엇을: 결과 수가 바뀌는 줄) / display
                             # (어떻게: 정렬·순서·보기·커버) 두 구역을 같은 자리·모양으로
                             # (사이에 선, display는 태블릿 이상 한 줄), onReset을 넘기면
                             # 필터를 건 동안 오른쪽 위 "필터 초기화". 켜고 끄는 칩 줄은
                             # FilterToggleRow. 새 옵션은 맞는 구역에 줄 하나만 더한다.
                             # 공연: 형식·연도·온라인 / 정렬·보기, 곡: 곡·MV·협업 / 정렬·순서·
                             # 보기, 앨범: (없음) / 정렬·순서·앨범 커버. 줄 모양은 공용
                             # FilterRow/FilterChip. "원곡·발매곡" 판별은
                             # song-metadata.ts의 isCountableOriginal 하나
                             # (통계 곡 기록 — 어레인지·미공개·협업곡 제외).
                             # 참전 기록은 협업곡을 들은 곡엔 넣고 "못 들은 곡"엔
                             # 안 넣는다(AttendanceSong.collab). 첫 화면 곡 수는
                             # 미공개곡만 뺀 수(협업곡·어레인지 포함,
                             # getReleasedSongCount), 연혁엔 협업곡을 "협업" 태그로
                             # 남긴다. 어레인지 버전은 원곡의 collab을 물려받는다
                             # (song-db/data.ts resolveDisplaySong).
      stats/                # 통계(/zutopia/stats). data.ts가 빌드 때 공연일
                             # (getLiveHistory)·곡·앨범·투어를 모아 compute.ts
                             # (순수 함수·테스트)로 기록을 다 계산하고, 화면
                             # (StatsView)엔 글자로 정리된 순위 줄만 내린다.
                             # 공연일 1개 = 1회, 세트리스트 없는 공연일은 곡·공연
                             # 기록에서 빼고 횟수·장소·공백엔 넣는다. "모르는
                             # 구간"(세트리스트 없는 공연일 + 공연일이 하나도 없는
                             # 투어 기간)을 사이에 둔 첫 라이브·데뷔·첫 공개·공백 끝
                             # 부활은 빼고, 연속은 끊는다. 공연 공백엔 빈 투어 기간을
                             # "공연이 있던 때"로 넣는다. 참가율 = 발매 후 세트리스트
                             # 있는 공연일 중 부른 비율(순위도 정수 % 단위). 종류는
                             # 공연 목록과 같은 투어·페스티벌·콘서트. 페스티벌은
                             # 연도 표기를 뗀 이름, 공연장은 괄호를 뗀 원어 이름으로
                             # 묶는다. 페이지엔 기록마다 앞 5줄만(previewSections),
                             # 전체 순위표는 /zutopia/stats.json(force-static
                             # route.ts)을 "자세히 보기"에서 받아 SidePanel에.
                             # 동점은 같은 순위. LiveUnit의 통계 전용 필드(장소·
                             # 나라·첫 곡·앵콜)는 클라이언트로 넘길 때
                             # toClientUnit으로 뺀다.
      search/               # 첫 화면(/zutopia) 통합 검색. data.ts가 빌드 때 곡·
                             # 앨범·공연 + 곡별 세트리스트 연결(공연일은 투어로
                             # 묶음)로 인덱스를 만들고, search.ts가 브라우저에서
                             # 찾는다 — 곡이 걸리면 그 곡이 실린 앨범과 그 곡을
                             # 부른 공연도 "관련" 결과로 함께 보여준다(더 보기
                             # 없이 전부, 공연은 시작 연도별로 묶어 최신부터). 결과는 태블릿 이상은 검색창 바로
                             # 아래 드롭다운(배경막 없음, 바깥 클릭·Esc로
                             # 닫힘), 모바일은 카드 자리에 그대로. 검색어는
                             # 주소 ?q=에 둔다(뒤로가기·공유 유지).
                             # 하위 페이지는 헤더 검색 버튼·"/"·⌘K로 여는 검색 창
                             # (ZutopiaSearchDialog). 인덱스는 페이지에 싣지 않고
                             # 빌드 때 만든 /zutopia/search-index.json(force-static
                             # route.ts)을 처음 열 때 한 번 받는다. 검색창
                             # (SearchField)·결과(SearchResults, 일치 글자는
                             # findMatchRanges로 마젠타 면)는 첫 화면과 창이 같이 쓴다.
                             # 열림 상태는 search-dialog-store, 버튼은
                             # ZutopiaSearchButton, 창 본체는 SiteHeader가 dynamic으로
                             # (다른 페이지 번들에 안 들어가게). 창의 여닫힘·포커스는
                             # SidePanel과 같은 lib/use-presence·use-dialog-focus.
                             # "열린 창이 있는지"는 lib/open-modal의 hasOpenModal
                             # (닫혀도 DOM에 남는 드로어는 aria-hidden으로 제외).
      (스크롤)              # ZUTOPIA는 모든 페이지가 스크롤 박스 하나
                             # (ZutopiaScrollArea)를 같이 써서, 경로가 바뀌면
                             # 항상 맨 위로 되돌린다(쿼리만 바뀌는 드로어는 제외).
                             # 예외로 공연 목록은 상세에서 돌아오면(뒤로가기·
                             # 헤더 공연 탭) 필터와 스크롤 위치를 복원한다
                             # (LiveListView — 초기화 뒤에 돌아서 덮어씀). 상세에서
                             # 새로고침해 목록이 전체 로드로 열려도, 첫 화면을
                             # 그린 뒤 저장값을 적용해 복원한다.
      (안내 창)             # components/ZutopiaNotice — layout.tsx가 모든 즛토피아
                             # 페이지에 둔다. 확인은 24시간, 다시 보지 않기는 계속 숨김 —
                             # 둘 다 localStorage(키 ztmy-sounds:zutopia-notice에
                             # { version, until }). 안내 내용을
                             # 바꾸면 NOTICE_VERSION을 올려 다시 보이게 한다.
      nav.ts                # 헤더의 즛토피아 구역 이동(곡·앨범·공연·참전·연혁·통계) 항목.
                             # 헤더가 클라이언트라 registry.ts를 못 써서 따로
                             # 둔다 — 카테고리를 더하면 여기도 더한다. 곡·앨범
                             # 페이지 본문엔 따로 탭을 두지 않는다(헤더와 중복).
  components/               # 여러 기능이 공유하는 전역 컴포넌트
    mobile/                 # 모바일 전용 전역 컴포넌트
    icons/                  # 커스텀 SVG 아이콘 (외부 아이콘 라이브러리 미사용)
    SiteHeader.tsx           # 하위 페이지(guide·slam·info·zutopia) 공용 헤더.
                             # 태블릿 이상: 왼쪽 [로고(메인 링크) │ ‹ 페이지 이름
                             # (그 페이지 첫 화면 링크, 최상위 이름만)] + 오른쪽
                             # 페이지 전용 내비게이션(info 탭 / 즛토피아 구역
                             # 이동 — 즛토피아 첫 화면·가이드·슬램은 없음).
                             # ‹(뒤로가기)는 로고가 움직이지 않게 페이지 이름 앞,
                             # 면·테두리 없는 아이콘(GHOST_ICON_BUTTON_CLASS).
                             # 주소를 한 단계 위로(공연 상세 → 공연 목록, 목록 →
                             # ZUTOPIA, 가이드·슬램 곡 상세 → 곡 목록). 위가
                             # 메인이면 없음. 이 규칙(site-pages.ts의
                             # getParentPage)을 모바일 상단 바(MobileHeader)의
                             # 뒤로가기도 같이 쓴다 — 브라우저 기록이 아니라 한
                             # 단계 위로(바로 전 페이지가 그 위 페이지면 기록을
                             # 한 칸 되돌림), 위가 메인인 최상위 페이지엔 없음.
                             # 즛토피아 본문엔 제목·설명·뒤로가기를 두지 않고
                             # 화면에 안 보이는 h1(sr-only)만 둔다(상세 페이지는
                             # 자기 제목이 h1). 목록 합계 개수는 두지 않는다.
                             # 모바일은
                             # 상단 바(MobileHeader) 아래 한 줄로 내비게이션만.
                             # 페이지 이름은 site-pages.ts 한 곳에서 — 모바일 상단
                             # 바도 가운데에 같은 이름(로고는 메인에서만, 출처
                             # 페이지는 "출처"). 상단 바 가운데 글자(페이지 이름 ↔
                             # 곡 제목)가 바뀔 땐 0.2초 동안 엇갈려 사라지고
                             # 나타난다(mobile/header-title-transition.ts).
                             # 헤더 탭은 버튼 면 없이 글자 색 + 마젠타 밑줄
                             # (HEADER_TAB_CLASS / ACTIVE_HEADER_TAB_CLASS).
                             # 모바일 상단 바 가운데는 어느 페이지든 로고다.
                             # 로고가 메인 링크라 하위 페이지 본문엔 "홈으로"
                             # 버튼을 두지 않는다(출처 페이지는 헤더가 없어 유지).
                             # 헤더 높이(4rem)는 가이드·슬램 패널 높이
                             # calc(94vh-4rem)에 들어가 있다.
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
  때만 뜹니다(구간이 끝나도 0.5초 더 남았다가 사라짐) — 모바일은 화면 우측 중앙에
  고정, tablet 이상은 영상 아래 응원 표시 안내·곡 설명 오른쪽의 "동작 예시" 칸
  (`SwingGuideGifSlot`, 자리는 늘 있고 GIF가 없는 곡은 칸 전체를 비활성처럼 — 점선
  테두리·옅은 면에 빗금 무늬와 이미지 없음 아이콘, "GIF 없음" — 해서 "재생 전"과 구분,
  슬램 가이드엔 칸 없음). 가사는 가리지 않습니다. GIF 경로는 음원 버전에서도 정식(live) 데이터의 값을 씁니다.
  `swingGif: true` 줄이 연달아 붙은 구간에 들어갈 때마다 애니메이션을 첫 프레임부터
  다시 재생합니다(노래 박자와 맞추기 위함).
  `swingGif`에 경로를 배열로 여러 개 적으면 하나가 한 바퀴 끝날 때마다 다음 것으로
  번갈아 재생합니다(한 바퀴 길이는 애니메이션 WebP의 프레임 시간을 읽어서 계산하므로
  WebP로 넣어야 함. 예: 해마성장통). 화면엔 작게(보통 100~120px) 뜨므로 원본을
  그대로 넣지 말고 표시 크기의 2배 정도로 줄이고, 프레임이 많으면 솎아 냅니다.
  원본 비율이 정사각형이 아니면 `Song.swingGifSize`(px)를 지정해 파일은 그대로 두고
  화면에서만 그 크기 정사각형에 맞춰 가운데 부분만 보이게 할 수 있습니다
  (예: 400x200 → `swingGifSize: 100`이면 가운데 200x200이 100x100으로 표시).
  자르지 않고 원본 비율 그대로 보이려면 `swingGifSize` 대신 `Song.swingGifWidth`(모바일
  표시 폭, px)를 적습니다 — 태블릿 이상 "동작 예시" 칸은 칸 폭에 맞추고 높이가 비율을
  따릅니다(예: 타이다다 16:9, `swingGifWidth: 200`).
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
- 공연을 하루하루의 "공연 단위"로 나눈 데이터(`live-history/`)는 디스코그래피
  마지막 라이브·참전 기록·활동 연혁이 같이 씁니다. 공연 단위 ID는
  `${lives.id}:${YYYY-MM-DD}`이고 사용자 체크 내역의 저장 키라, 나누는 규칙을
  바꾸면 저장된 체크가 어긋납니다(`live-history/units.ts` 주석 참고).

### 별명(aliases)과 통합 검색

- `songs`·`albums`·`tours`·`lives`에 `aliases text[]`(기본 `'{}'`)가 있습니다
  (`supabase/migrations/20261106000000_add_aliases.sql`). 통합 검색(`search/search.ts`)이 제목과
  똑같이 찾습니다 — 띄어쓰기를 뺀 검색어가 들어 있거나, 띄어 친 단어가 각각 들어 있으면 걸립니다
  ("니와 투 니라"는 "니와"·"투"·"니라"·"니라 니와"로 찾힘). 투어는 소속 공연일의 별명도 합칩니다.
- 검색 인덱스는 빌드 때 만들어지므로 별명을 고치면 다시 빌드·배포해야 반영됩니다(`.next/cache/fetch-cache`
  캐시 주의).
- 공연·투어 검색용 조회는 컬럼이 없는 DB에서도 깨지지 않게 `select("*")` + `aliasesOf()`로 읽습니다.

### 날짜

- "YYYY-MM-DD" 날짜 계산(더하기·차이·요일)은 `src/lib/ymd.ts`만 씁니다(UTC 자정 기준, 시간대 무관).
- "오늘"은 한국 날짜 — 빌드 쪽 `koreaDate()`(`src/lib/korea-date.ts`), 브라우저 쪽
  `useKoreaToday()`(`src/lib/use-korea-today.ts`, 정적 HTML 단계에선 null).
- 참전 기록은 빌드 때 "예정"이던 공연일도 브라우저 날짜로 지났으면 체크 대상에 넣습니다
  (`attendance/arrived-units.ts`).

### 참전 기록: 브라우저 저장

- 체크 내역은 `localStorage`의 `ztmy-sounds:live-attendance` 한 키에
  `{ version: 1, attended: string[], updatedAt }` JSON으로 둡니다
  (`attendance/storage.ts`). 백업 파일도 같은 형식입니다. 형식을 바꾸면
  `version`을 올리고 이전 버전을 읽는 코드를 남기세요.
- 공유 코드(`attendance/share-code.ts`)는 `ZT1` + base64url, 공연(lives 행)마다 id 앞 4바이트 + 날짜 비트 1바이트입니다(8일 넘는 공연은 같은 id 블록을 이어 붙여 9~16일째…를 담음 — 나온 순서가 몇째 8일 묶음). 공연 순번이 아니라 id로 가리켜서 공연이 추가돼도 퍼진 코드가 깨지지 않습니다. 형식을 바꾸면 `ZT2`처럼 접두사를 올리고 `ZT1` 읽기는 남기세요.
- 이미지 닉네임은 `ztmy-sounds:attendance-nickname` 키에 따로 저장합니다.
- 읽기는 `useAttendedUnits`(`useSyncExternalStore`)로만 — 정적 HTML 단계에선
  `ready`가 false라 체크 상태를 그리지 않습니다.

### 활동 연혁: 위치 계산 · 확대 단계

- 일정 위치는 전부 `timeline/events.ts`의 `dateToOffset(날짜, 시작일, pxPerDay)` 하나로
  계산합니다.
- 가로 축(PC)은 확대 단계가 셋입니다(`timeline/zoom.ts`): **연**(해마다 요약 카드, 모든
  해가 화면 폭에 들어가게 `yearPxPerDay`), **월**(달마다 묶음 카드, 5px/일), **주**(일정
  하나하나, 12px/일 — `assignLanes`로 겹치는 카드를 다른 줄에). 묶기는
  `timeline/buckets.ts`(주는 월요일 시작). 단계를 바꿀 때 기준점 아래 날짜는
  `daysAt`/`scrollLeftFor`로 제자리에 둡니다.
- 가로 축은 화면에 남은 높이를 직접 재서 채웁니다(`HorizontalTimeline` — main의 보이는
  높이 − 위쪽 내용 − 페이지 아래 padding − 푸터). 페이지가 세로로 스크롤되면 이 계산이
  어긋난 것입니다.
- 세로 축(모바일)도 연·월·주 세 단계입니다(주 단계는 카드 사이 빈칸 0.6px/일, 최소 8px·최대
  160px). 처음 스크롤은 바깥 main의 scrollTop만 바꿉니다(scrollIntoView 금지 — body가 움직임).
- 예정 공연은 `getLiveHistory().upcoming`(집계에 안 들어감)으로 받아 연혁에만 "예정"으로 그립니다.
- 공연 **횟수**는 통계와 같은 기준입니다 — 공연일 하나당 1, 그 공연일 날짜의 해, 온라인·예정
  제외(`TimelineEvent.showDates` → `showsByYear`·`liveSummary`). 투어는 축 위에 시작일의
  일정 하나로 그리지만, 해를 넘기는 투어의 공연일은 해마다 나뉘어 세집니다. 곡·앨범과 공연
  "일정" 수(`countByYear`·`KindCounts`, 투어·페스티벌 하나 = 1)는 시작일의 해 기준입니다.
- 화면 높이 측정은 `PageScrollBody`의 `data-page-body`·`data-page-footer` 표시로 찾습니다.
- 앨범과 **같은 날** 발매로 들어간 수록곡은 앨범 일정 하나로 합칩니다. 곡 `release_date`가
  앨범과 하루라도 다르면 따로 그려지니, 데이터의 발매일을 맞춰 두세요.
- 빌드는 Supabase 조회 결과를 `.next/cache/fetch-cache`에 남깁니다. 데이터를 고쳤는데
  빌드 결과가 그대로면 이 폴더를 지우고 다시 빌드하세요.

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
- `accents`(선택, 예전 이름 `claps`)는 응원 강조 타이밍입니다. 박수 줄은 `pronunciation` 속 ✋의 타이밍입니다(✋는 따라 부르는 발음 줄에
  적고, 응원 단어처럼 `**…**`로 감싸면 형광펜도 함께 칠해집니다). **그 줄 `time`으로부터 몇 초
  뒤인지**를 숫자 배열로 적고, ✋를 앞에서부터 순서대로 하나씩 대응합니다
  (예: `time: "3:40.7"`, `accents: [1.4, 2.2, 2.4]` → 3:42.1, 3:42.9, 3:43.1).
  재생 중인 줄에서만 동작하며, 칠 차례가 아닌 ✋는 흐리게, 타이밍이 된 ✋는 튀어
  오르며 같은 ✋ 잔상이 커지며 사라지고, 그때마다 가사 줄 배경이 박수 색으로 울립니다
  (`ClapText.tsx`의 `pulseLine`, Web Animations API로 줄 요소에 직접 재생). 개수가 모자라면 남는 ✋는 그냥 표시됩니다.
  ✋ 사이 간격은 표기로 정합니다: 붙여 쓰면(`✋✋`) 간격 없음, 띄어쓰기는 0.4em,
  슬래시(`/`)는 1em(슬래시 문자는 화면에 안 보임). 예: `✋ ✋✋/✋ ✋✋`. 첫 ✋
  앞은 0.5em 더 띄웁니다.
  이 규칙은 `accents`가 없는 줄의 ✋에도 똑같이 적용됩니다.
  ✋가 없는 응원 줄(흔들기·노래·댄스)에 `accents`를 적으면 발음 줄의 강조 단어(`**…**`)를
  앞에서부터 차례로 하나씩 대응합니다 — 아직 차례가 아닌 단어는 흐리게, 타이밍이 되면 켜지며
  살짝 튀어 오르고, 같은 순간 줄 왼쪽 아이콘이 그 응원 동작을 크게 한 번(흔들기는 좌우로
  번갈아 기울기, 댄스는 통통 튀기) 하고 줄 배경이 응원 색으로 번쩍입니다(`AccentPulse`,
  공용 로직은 `lib/accent-pulse.ts`). 예: `pronunciation: "**ye** **ye** **ye** **yey~**"`,
  `accents: [0.35, 0.7, 1.0, 1.3]`. 강조 단어보다 타이밍이 적으면 남는 단어는 평범하게
  보입니다.
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
  - 이동(뒤로가기·메인으로, 설치·공유, 푸터 건의·출처):
    `NAV_BUTTON_CLASS` — 어두운 면 + 2px 테두리
  - 필터(가이드 곡 목록, ZUTOPIA 곡·앨범·공연 정렬/필터 전부):
    `src/components/FilterChips.tsx`의 `FilterRow`(왼쪽 이름 + 칩들) +
    `FilterChip`을 씁니다. 칩 모양은 `FILTER_CHIP_CLASS`, 고른 칸은 `ACTIVE_FILTER_CHIP_CLASS` — 작은 칸 +
    1px 테두리, 고르면 마젠타로 옅게 칠함. 모바일은 칩이 넘치면 그 줄만 가로
    스크롤, `wrap`(SortFilterBar는 `compact`)이면 작은 칩 + 줄바꿈(공연 연도).
    켜고 끄는 옵션(마지막 라이브)도 체크박스 대신 같은 칩. 여러 값 중 하나를
    고르는 건 켜고 끄는 칩 대신 한 줄(SortFilterBar) — 곡 목록 "곡: 전체 ·
    발매곡 · 미공개곡"(개수 포함, 미공개곡이 있을 때만).
  - 헤더 탭(공연 정보 탭, 즛토피아 곡·앨범·공연): `HEADER_TAB_CLASS`, 고른 칸은
    `ACTIVE_HEADER_TAB_CLASS` — 면 없이 글자 색 + 마젠타 밑줄, 헤더 높이를 꽉 채움
  - 링크(다른 페이지·구역으로 이동하는 글자 버튼): `LINK_BUTTON_CLASS` — 투명 면 + 2px
    테두리, 필요하면 끝에 화살표 아이콘
  - 동작(모바일 설치 배너의 "추가"처럼 눌러서 실행): `ACTION_BUTTON_CLASS` — 사이트
    대표색(마젠타) 단색 면
  - 차분한 채움 버튼(참전 기록 페이지의 작업 버튼): `SOFT_BUTTON_CLASS` — 옅은 흰 면 +
    얇은 테두리, 주 동작은 `SOFT_PRIMARY_BUTTON_CLASS` — 마젠타를 옅게 섞은 면(원색 단색
    면 대신), 그와 나란히 놓이는 또 하나의 중요한 동작(공연 체크)은
    `SOFT_PURPLE_BUTTON_CLASS` — 보라를 옅게 섞은 면. 투명 면·원색 면이 어색한 작업
    창·현황 줄 버튼에 씁니다.
  - 닫기·헤더 뒤로가기 같은 테두리 없는 아이콘 버튼: `GHOST_ICON_BUTTON_CLASS`
  - 콘텐츠 옆에서 눈에 덜 띄어야 하는 글자 버튼(가이드 상세 영상 위 버튼 줄):
    `GHOST_BUTTON_CLASS` — 면·테두리 없이 흐린 글자, 마우스를 올리면 옅은 면
  - 목록의 한 줄(가이드 곡 목록·곡 목록 드로어): `LIST_ITEM_CLASS`, 고른 줄은
    `ACTIVE_LIST_ITEM_CLASS`(줄 전체를 옅게 칠함)
  - 포커스 표시는 `FOCUS_RING`을 씁니다(위 상수들에는 이미 들어 있음).

- 커스텀 브레이크포인트: `tablet`(50rem/800px) / `pc`(67.5rem/1080px) / `wide`(90rem/1440px).
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
- `PageScrollBody`는 내부적으로 `<Footer inline />`을 렌더링하지만, 이 스크롤 끝 푸터(모바일
  전용)는 출처 페이지(/credits)에서만 그립니다(`Footer.tsx`의 `INLINE_FOOTER_PATHS`). 그래서
  모바일 푸터는 메인(/, 루트 레이아웃 인스턴스)과 출처에만 있고, /info·/zutopia 상세 화면엔
  없습니다. 다른 페이지에도 붙이려면 그 목록에 경로를 더하세요. 가이드·슬램 화면엔 푸터가
  없습니다(목록·가사가 화면 높이를 다 씀).
- 푸터(`src/components/Footer.tsx`)는 배경 띠·경계선 없이 글자 그림자만 줍니다.
  - 태블릿 이상(메인 화면에서만 보임, 한 줄): 왼쪽에 운영자가 정한 저작권 문구 그대로
    (`lib/seo.ts`의 `COPYRIGHT_NOTICE`) + 공식 링크 아이콘, 오른쪽에 사이트 기능 버튼 묶음
    [설치][공유] | [건의][출처]. 설치(`InstallButton`)는 설치 가능할 때만 보입니다.
    화면 높이가 700px 이하면 홈 카드들과 겹쳐서 숨깁니다(`tablet:xlow:hidden`).
  - 모바일(두 줄): 공식 링크 아이콘 줄, 그 아래 줄인 문구("비공식 팬 페이지 · © ZUTOMAYO ·
    출처" — 출처는 글자 링크) +
    건의 버튼. 저작권 전문은 출처 페이지(/credits)에도 있습니다.
- 공유(`ShareButton`, `lib/use-share.ts`)는 지금 보고 있는 페이지 주소를 보냅니다.
  자리: PC 메인 푸터, 가이드·슬램 곡 상세의 PC 상단 막대(`GuideDetailToolbar`),
  모바일 상단 바(메인과 곡 상세).
- 공식 링크 아이콘(`data/social-links.ts`의 `OFFICIAL_ICON_LINKS` — zutomayocalendar.net
  푸터와 같은 유튜브, X 메인·스태프, 인스타그램 메인·스태프·mart, 아이콘도 같은
  이미지를 `public/assets/footer/`에 두고 그대로 씀)은 푸터에 있습니다
  (`components/OfficialLinks`) — PC는 저작권 문구 바로 옆(한 줄), 모바일은 저작권
  줄 위의 아이콘 줄. 계정 구분은 대체 텍스트·마우스 설명(title)의 계정 이름으로.
- 건의 폼(Tally) 주소는 `lib/feedback.ts`의 `getFeedbackUrl()`로 만듭니다. 곡 가사
  맨 끝의 "이 곡 싱크·가사 오류 제보"는 `title`(곡 한국어 제목)·`mode`(cheer/slam)를 넘기는데,
  Tally 폼에 같은 이름의 숨김 필드(Hidden fields)가 있어야 값이 채워집니다.

- 메인에서 들어올 때 내용이 서서히 나타나게 하려면 `src/components/EntranceFade.tsx`로
  감쌉니다(/info, /zutopia). /guide의 패널과 같은 훅(`src/lib/use-entrance-visible.ts`)을
  써서 배경이 어두워지는 타이밍과 맞습니다. 레이아웃에 두면 하위 페이지를 오갈 땐
  다시 재생되지 않고, `replayKey`(보통 경로)를 주면 그 값이 바뀔 때마다 다시 재생됩니다
  (/zutopia — 내용을 다시 마운트하지 않음). 움직임 줄이기 설정이면 바로 보입니다.

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
  iOS/dismissed 판별). 여러 곳이 같이 읽는 값은 `useSyncExternalStore`
  (서버 스냅샷 = 고정값)로 읽으면 effect 없이 해결됩니다(예: `useAttendedUnits`,
  `SongListView`의 `useToday`).
- 이 패턴은 `react-hooks/set-state-in-effect` 린트 규칙과 충돌합니다(effect
  본문에서 직접 `setState`를 부르지 말라는 규칙) — 위 사유로 불가피한
  경우, 이유를 적은 `// eslint-disable-next-line react-hooks/set-state-in-effect --
...` 주석과 함께 예외 처리하세요.

## Git / 커밋

- Conventional Commits 접두사를 사용합니다 (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `style:` 등). 곡 가사/응원법 데이터만 바꾸는 커밋은 `song:` 접두사를
  씁니다.
- 관심사 단위로 잘게 나눠서 커밋합니다 (파일/기능 하나당 커밋 하나를 지향).
