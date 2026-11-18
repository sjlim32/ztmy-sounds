import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * 곡 데이터 파일이 git에 처음 들어온 날짜 = 응원 가이드에 곡이 추가된 날짜.
 * 빌드할 때(RSS 라우트) Node에서만 부른다 — 배포가 로컬 빌드(pnpm pages:deploy)라
 * git 기록 전체를 읽을 수 있다.
 *
 * 파일 이름과 곡 id가 다른 곡이 있어(20_obenkyou-shitoiteyo.ts → "study-me")
 * 파일 안의 `id: "..."`를 읽어 연결한다. 아직 커밋 안 된 새 곡이나 git을 못 쓰는
 * 환경이면 날짜가 없으니 호출하는 쪽에서 빌드 시각으로 채운다.
 */
const ROOT = process.cwd();
const SONGS_DIR = "src/features/guide/data/songs";

export interface PathChange {
  status: "A" | "R";
  /** R일 때 옮기기 전 경로 */
  from?: string;
  path: string;
}

export interface PathCommit {
  date: Date;
  changes: PathChange[];
}

/**
 * 최신→과거 순 커밋 목록에서 `file`이 처음 추가된 날짜를 찾는다. 이름 변경(R)만
 * 거슬러 올라간다 — `git log --follow`는 복사(C)까지 따라가서, 다른 곡 파일을
 * 복사해 만든 곡이 원본 곡의 날짜를 받아 버린다.
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
      if (change.from) current = change.from;
    }
  }
  return null;
}

/** `git log --name-status --format=%x00%aI` 출력 → 커밋 목록 */
export function parseNameStatusLog(out: string): PathCommit[] {
  return out
    .split("\0")
    .filter(Boolean)
    .map((block) => {
      const [date, ...lines] = block.split("\n");
      const changes: PathChange[] = [];
      for (const line of lines) {
        const [status, a, b] = line.split("\t");
        if (status === "A" && a) changes.push({ status: "A", path: a });
        else if (status?.startsWith("R") && a && b)
          changes.push({ status: "R", from: a, path: b });
      }
      return { date: new Date(date.trim()), changes };
    });
}

function readGitHistory(): PathCommit[] {
  try {
    const out = execFileSync(
      "git",
      [
        "log",
        "-M",
        "--diff-filter=AR",
        "--name-status",
        "--format=%x00%aI",
        "--",
        "src",
      ],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return parseNameStatusLog(out);
  } catch {
    return [];
  }
}

export function getSongAddedDates(): Map<string, Date> {
  const commits = readGitHistory();
  const dates = new Map<string, Date>();
  for (const name of readdirSync(path.join(ROOT, SONGS_DIR))) {
    if (!/^\d+_.+\.ts$/.test(name)) continue;
    const file = `${SONGS_DIR}/${name}`;
    const id = readFileSync(path.join(ROOT, file), "utf8").match(
      /^\s*id: "([^"]+)"/m,
    )?.[1];
    if (!id) continue;
    const date = findAddedDate(commits, file);
    if (date) dates.set(id, date);
  }
  return dates;
}
