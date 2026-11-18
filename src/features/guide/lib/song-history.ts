/**
 * 곡 데이터 파일의 git 기록 해석(순수 함수) — git을 실제로 부르는 쪽은
 * song-history-git.ts(빌드 전용). RSS의 "추가된 날짜"와 사이트맵의 "마지막 수정일"이 쓴다.
 */

export interface PathChange {
  status: "A" | "M" | "R";
  /** R일 때 옮기기 전 경로 */
  from?: string;
  /** R일 때 git이 매긴 내용 유사도(R100 = 이름만 바꿈) */
  similarity?: number;
  path: string;
}

export interface PathCommit {
  date: Date;
  changes: PathChange[];
}

/** 공개된 곡 데이터가 있었던 폴더 — 지금 위치와 예전 위치(src/data/songs). 미리 채워
 * 두는 not-yet/에서 옮겨 온 날이 곧 공개된 날이라 그 폴더는 넣지 않는다. */
const PUBLISHED_SONG_DIRS = [
  "src/features/guide/data/songs/",
  "src/data/songs/",
];

function isPublishedSongPath(file: string): boolean {
  return PUBLISHED_SONG_DIRS.some((dir) => file.startsWith(dir));
}

/**
 * 최신→과거 순 커밋 목록에서 `file`이 처음 추가된 날짜를 찾는다. 이름 변경(R)만
 * 거슬러 올라간다 — `git log --follow`는 복사(C)까지 따라가서, 다른 곡 파일을
 * 복사해 만든 곡이 원본 곡의 날짜를 받아 버린다. 공개 곡 폴더 밖(not-yet/ 등)에서
 * 옮겨 온 커밋은 그때를 추가된 날로 본다.
 */
export function findAddedDate(
  commits: readonly PathCommit[],
  file: string,
): Date | null {
  let current = file;
  for (const commit of commits) {
    for (const change of commit.changes) {
      if (change.path !== current) continue;
      if (change.status === "A") return commit.date;
      if (change.from) {
        if (!isPublishedSongPath(change.from)) return commit.date;
        current = change.from;
      }
    }
  }
  return null;
}

/**
 * 최신→과거 순 커밋 목록에서 `file`의 내용을 마지막으로 바꾼 커밋 날짜. 내용 그대로
 * 이름만 바꾼 커밋(R100 — 곡 번호 일괄 재정렬 등)은 수정으로 치지 않고 옮기기 전
 * 경로로 이어서 찾는다 — 안 그러면 재정렬 한 번에 모든 곡의 lastmod가 같아진다.
 */
export function findLastModifiedDate(
  commits: readonly PathCommit[],
  file: string,
): Date | null {
  let current = file;
  for (const commit of commits) {
    const change = commit.changes.find((c) => c.path === current);
    if (!change) continue;
    if (change.status === "R" && change.similarity === 100 && change.from) {
      current = change.from;
      continue;
    }
    return commit.date;
  }
  return null;
}

/** `git log --name-status --format=%x00%aI` 출력 → 커밋 목록(A·M·R만 남긴다) */
export function parseNameStatusLog(out: string): PathCommit[] {
  return out
    .split("\0")
    .filter(Boolean)
    .map((block) => {
      const [date, ...lines] = block.split("\n");
      const changes: PathChange[] = [];
      for (const line of lines) {
        const [status, a, b] = line.split("\t");
        if ((status === "A" || status === "M") && a)
          changes.push({ status, path: a });
        else if (status?.startsWith("R") && a && b)
          changes.push({
            status: "R",
            from: a,
            similarity: Number(status.slice(1)),
            path: b,
          });
      }
      return { date: new Date(date.trim()), changes };
    });
}

/** 곡 데이터 파일 내용에서 곡 id(`id: "..."`) — 파일 이름과 id가 다른 곡이 있다
 * (20_obenkyou-shitoiteyo.ts → "study-me"). */
export function parseSongId(source: string): string | null {
  return source.match(/^\s*id: "([^"]+)"/m)?.[1] ?? null;
}
