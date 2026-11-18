import "server-only";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  findAddedDate,
  findLastModifiedDate,
  parseNameStatusLog,
  parseSongId,
  type PathCommit,
} from "@/features/guide/lib/song-history";

/**
 * 곡 데이터 파일의 git 날짜 — 빌드할 때(RSS 라우트·사이트맵) Node에서만 부른다.
 * 배포가 로컬 빌드(pnpm pages:deploy)라 git 기록 전체를 읽을 수 있다. 얕은
 * 클론(CI 등)에서 빌드하면 경계 커밋이 모든 파일을 추가(A)로 보여 모든 곡이 같은
 * 날짜가 되니 그런 곳에서 배포하지 않는다(docs/RULES.md) — 빌드 로그에 경고가 뜬다.
 *
 * 아직 커밋 안 된 새 곡이나 git을 못 쓰는 환경이면 날짜가 없다 — RSS는 빌드 시각으로
 * 채우고, 사이트맵은 lastmod를 넣지 않는다.
 */
const ROOT = process.cwd();
const SONGS_DIR = "src/features/guide/data/songs";

export interface SongGitDates {
  /** 응원 가이드에 추가된 날짜 — 파일이 공개 곡 폴더에 처음 들어온 커밋 */
  added: Date;
  /** 마지막으로 고친 날짜 — 지금 경로의 파일을 바꾼 마지막 커밋 */
  modified: Date;
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function readGitHistory(): PathCommit[] {
  try {
    if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
      console.warn(
        "[song-history] 얕은 클론이라 곡 날짜가 틀립니다(모든 곡이 같은 날짜) — 전체 기록이 있는 저장소에서 빌드하세요.",
      );
    }
    return parseNameStatusLog(
      git([
        // 한글 등 ASCII 밖 경로를 "\355\225..." 식으로 감싸지 않게.
        "-c",
        "core.quotePath=false",
        "log",
        "-M",
        "--diff-filter=AMR",
        "--name-status",
        "--format=%x00%aI",
        "--",
        "src",
      ]),
    );
  } catch (error) {
    console.warn(
      "[song-history] git 기록을 못 읽었습니다 — RSS 곡 날짜는 빌드 시각, 사이트맵 곡 lastmod는 생략:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** 곡 id → git 날짜. 기록이 없는 곡(커밋 전 새 곡)은 빠진다. */
export function getSongGitDates(): Map<string, SongGitDates> {
  const commits = readGitHistory();
  const dates = new Map<string, SongGitDates>();
  for (const name of readdirSync(path.join(ROOT, SONGS_DIR))) {
    if (!/^\d+_.+\.ts$/.test(name)) continue;
    const file = `${SONGS_DIR}/${name}`;
    const id = parseSongId(readFileSync(path.join(ROOT, file), "utf8"));
    if (!id) continue;
    const added = findAddedDate(commits, file);
    const modified = findLastModifiedDate(commits, file);
    if (added && modified) dates.set(id, { added, modified });
  }
  return dates;
}
