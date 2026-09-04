# 퀴즈 난이도/문제 풀 분리 설계서

- 작성일: 2026-09-05
- 상위 문서: [`docs/superpowers/specs/2026-09-04-quiz-feature-design.md`](2026-09-04-quiz-feature-design.md) — 이 문서는 그 설계에 난이도/문제 풀 구분을 추가하는 확장분만 다룬다.

## 1. 목적

- 연습 모드에 난이도 4단계(뉴비/청년/고인물/할배)를 도입해, 문제 풀기 경험 자체를 재미있게 만든다.
- 실제 테스트를 "시험 전용 문제 풀"과 "연습 풀의 상위 난이도"로 섞어 출제해, 연습으로 실제 테스트 전체를 미리 외울 수 있는 위험을 기존 100%(스펙 §5의 기존 한계)에서 20%(2/10)로 줄인다.

## 2. 데이터 모델 변경

`quiz_questions`에 컬럼 2개 추가 (기존 원격 프로젝트에 데이터가 전혀 없어 백필 불필요):

```sql
alter table quiz_questions
  add column pool text not null default 'practice' check (pool in ('practice', 'test_only')),
  add column difficulty text check (difficulty in ('easy', 'medium', 'hard', 'extreme'));
```

- `difficulty`는 nullable이고 `pool`과의 교차 제약(check)을 걸지 않는다 — `pool='practice'`인데 `difficulty`가 비어있으면 그냥 연습 모드 출제 대상에서 조용히 제외될 뿐, INSERT를 막지는 않는다. 이렇게 하면 이미 존재하는 pgTAP 픽스처(001·002·005·009 등)가 새 컬럼을 몰라도 그대로 통과한다.
- 표시 이름 매핑(프론트엔드 상수, DB에는 저장 안 함): `easy`→"즛 뉴비", `medium`→"즛 청년", `hard`→"즛 고인물", `extreme`→"즛 할배".

## 3. RPC 변경

### `get_random_practice_question(p_difficulty text)`

시그니처 변경(기존 무인자 → 1개 인자). `where pool = 'practice' and difficulty = p_difficulty and is_active`로 필터 후 무작위 1문제. 반환 shape(`{id, type, question_text, choices}`)은 그대로.

### `start_quiz_attempt` (구성 로직 변경, 반환 shape/RPC 계약은 동일)

1. 기존과 동일하게 `submitted` 중복 체크 → `in_progress` 재사용 체크.
2. 새로 응시를 시작하는 경우:
   - `test_only` 풀의 활성 문제 수가 8 미만이면 예외.
   - `practice` 풀에서 `difficulty in ('hard','extreme')`인 활성 문제 수가 2 미만이면 예외.
   - `test_only`에서 무작위 8개 + `practice`의 `difficulty in ('hard','extreme')` 전체(즉 hard/extreme 구분 없이 합쳐서)에서 무작위 2개를 뽑아 합친 뒤 순서를 한 번 더 섞는다(어느 문제가 어느 풀 출신인지 순서로 추측 못 하게). hard 1개+extreme 1개처럼 구성을 강제하지 않는다 — hard 2개, extreme 2개 모두 유효.
3. 이후 로직(attempt 생성, 응답 shape)은 기존과 동일.

### `reveal_practice_answer(p_question_id uuid)`

`pool = 'practice'`인 문제만 정답 공개 허용하도록 조건 추가 (`where id = p_question_id and is_active and pool = 'practice'`). test_only 문제 id를 직접 조회 시도해도 "question not found"로 거부.

### `submit_quiz_attempt`

변경 없음 — `question_ids` 배열 기준으로 채점하므로 풀 구성과 무관하게 동작한다.

## 4. 프론트엔드 변경

- `src/features/quiz/lib/types.ts`: `Difficulty = "easy" | "medium" | "hard" | "extreme"` 타입과 `DIFFICULTY_LABELS: Record<Difficulty, string>` 표시 이름 상수 추가.
- `src/features/quiz/lib/api.ts`: `getRandomPracticeQuestion(difficulty: Difficulty)`로 시그니처 변경, RPC 호출에 `p_difficulty` 전달.
- `src/app/(pages)/quiz/practice/page.tsx`: `output: "export"` 정적 사이트라 동적 라우트(`generateStaticParams`) 대신 쿼리스트링(`?difficulty=easy`)으로 처리.
  - 쿼리스트링 없음 → 난이도 선택 화면(4개 카드/버튼, 각각 해당 난이도의 `?difficulty=` 링크).
  - 쿼리스트링 있음 → 기존 `QuizPractice` 컴포넌트를 해당 난이도로 렌더링.
- `src/features/quiz/components/QuizPractice.tsx`: `difficulty: Difficulty` prop 추가, `getRandomPracticeQuestion(difficulty)` 호출 및 `loadQuestion`/`fetchQuestion`의 의존성 배열에 반영.

## 5. 영향받는 기존 pgTAP 테스트

- **003** (`get_random_practice_question`): 함수 시그니처가 바뀌므로 전면 재작성 — `pool='practice'`, 각 난이도 픽스처 삽입 후 특정 난이도만 필터되는지 검증.
- **004** (`start_quiz_attempt`): 기존 픽스처(단일 풀, 무구분 12문항)로는 새 로직의 "test_only 8개 이상" 조건을 못 만족하므로 재작성 — `test_only` 8개 이상 + `practice` hard/extreme 2개 이상으로 픽스처 구성 후, 반환된 10문항이 두 풀에서 올바른 비율로 왔는지, 각 풀 부족 시 예외가 뜨는지 검증.
- **008** (`attempt_dedupe_hardening`): `start_quiz_attempt`를 반복 호출하는 기존 시나리오(in_progress 재사용, fingerprint 충돌)들이 새 픽스처 구성에서도 그대로 성립하는지 재작성.
- **006** (`reveal_practice_answer`): 기존 어산션 유지하고, `pool='test_only'` 문제에 대한 reveal 시도가 거부되는 어산션 1개 추가.
- **001, 002, 005, 009**: 영향 없음 — `pool`/`difficulty` 컬럼을 참조하지 않는 픽스처/어산션이라 그대로 통과.

## 6. 확인이 필요한 가정

- `test_only` 풀은 별도의 난이도 구분 없이 8문항을 통째로 관리한다고 가정했다 — 나중에 시험 풀에도 난이도가 필요해지면 별도로 확장.
- 로컬 개발용 `supabase/seed.sql`은 이번 설계에 맞춰 `test_only` 8문항 + 난이도별 `practice` 문항(hard/extreme 최소 2개 포함)으로 다시 채운다.
