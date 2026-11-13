// 로컬 폰트를 실제로 쓰는 글자만 남긴 woff2로 줄여 src/fonts/subset/에 씁니다.
// 원본(851MkPOP 4.4MB, LINE Seed KR 굵기당 0.5MB)을 그대로 preload하면 첫 로딩
// 전송량의 대부분을 폰트가 차지합니다. next.config.ts가 dev·build를 시작할 때마다
// 실행하므로 결과물은 git에 올리지 않고, 곡을 추가해도 따로 할 일이 없습니다.
//
//   node scripts/subset-fonts.mjs              서브셋 생성 (입력이 같으면 건너뜀)
//   node scripts/subset-fonts.mjs --check-out  빌드 결과(out/)의 글자가 서브셋에 다 있는지 검사
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codesInRanges, toUnicodeRange } from "./unicode-range.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SRC_DIR = path.join(ROOT, "src");
const FONT_DIR = path.join(SRC_DIR, "fonts");
const SUBSET_DIR = path.join(FONT_DIR, "subset");
const HASH_FILE = path.join(SUBSET_DIR, ".inputs-hash");
const REST_CSS_FILE = path.join(SUBSET_DIR, "line-seed-kr-rest.css");
const BUILD_DIR = path.join(ROOT, "out");

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;

// Supabase에서 온 텍스트처럼 소스에는 없는 글자(한글 음절·기호) — 빌드 때에야
// 들어와서 아래 수집에 잡히지 않습니다. `--check-out`이 알려 주면 여기에 적습니다
// (LINE Seed KR 기본 조각에 들어갑니다 — 안 적으면 그 글자가 있는 페이지는 나머지
// 조각까지 받습니다).
const EXTRA_CORE = "퀼콕룡앤징샹믹돔볶콰♡（）";

// OFL은 수정본에도 저작권·라이선스 고지를 요구하는데, 서브셋 과정에서 name
// 테이블의 해당 항목(상표·제작자·라이선스 문구/URL)이 기본으로 지워집니다.
const PRESERVED_NAME_IDS = [7, 8, 9, 11, 12, 13, 14];

function charsInRange(first, last) {
  let text = "";
  for (let code = first; code <= last; code++) {
    text += String.fromCodePoint(code);
  }
  return text;
}

function isHangulSyllable(char) {
  const code = char.codePointAt(0);
  return code >= HANGUL_FIRST && code <= HANGUL_LAST;
}

async function readFiles(dir, pattern) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return readFiles(fullPath, pattern);
      if (!pattern.test(entry.name)) return [];
      return [
        {
          file: path.relative(ROOT, fullPath).split(path.sep).join("/"),
          text: await readFile(fullPath, "utf8"),
        },
      ];
    }),
  );
  return files.flat();
}

// KS X 1001 완성형 한글 2,350자 — 일상 문장은 사실상 이 안에서 끝납니다.
function ksx1001Hangul() {
  const decoder = new TextDecoder("euc-kr");
  let text = "";
  for (let hi = 0xb0; hi <= 0xc8; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) {
      text += decoder.decode(Uint8Array.of(hi, lo));
    }
  }
  return text;
}

const sourceText = (await readFiles(SRC_DIR, /\.(ts|tsx|mdx|md)$/))
  .map(({ text }) => text)
  .join("");

// 851MkPOP — `font-mkpop`은 아티스트명·곡 제목에만 쓰고, 둘 다 `jp: "…"`로
// 선언돼 있습니다. 다른 형태로 적은 글자는 여기서 놓치지만 `--check-out`이 잡습니다.
const jpTitles = [
  ...sourceText.matchAll(
    /(?<![\w.$])jp:\s*(?:"([^"\\\n]*)"|'([^'\\\n]*)'|`([^`\\$\n]*)`)/g,
  ),
].map((match) => match[1] ?? match[2] ?? match[3]);
if (jpTitles.join("") === "") {
  throw new Error('`jp: "…"` 제목을 하나도 찾지 못했습니다.');
}
const mkpopChars = new Set(
  charsInRange(0x20, 0x7e) + // ASCII
    charsInRange(0x3000, 0x30ff) + // CJK 기호, 히라가나, 가타카나
    charsInRange(0xff00, 0xffef) + // 전각 영숫자·기호
    jpTitles.join(""),
);

// LINE Seed KR — 한글 음절 11,172자가 용량 대부분이라 KS X 1001과 소스에 실제로
// 등장하는 음절만 남깁니다. 한글 외 글리프(가나·기호 등)는 전부 둡니다.
const hangulChars = new Set(
  [...ksx1001Hangul(), ...EXTRA_CORE, ...sourceText].filter(isHangulSyllable),
);

// 그 글자들을 두 조각으로 나눕니다. 모든 페이지가 미리 받는 기본 조각(-core)엔
// 사이트 글자(소스에 나오는 글자 + 아래 블록)만, 나머지 조각(-rest)엔 그 밖의
// KS X 1001 음절·기호를 넣습니다. 나머지 조각은 이 스크립트가 만드는
// line-seed-kr-rest.css(정확한 unicode-range)로 선언하고 첫 화면 뒤에 불러와
// (DeferredFonts), 그 글자가 화면에 나올 때만 받습니다(검색어 입력 등).
// 글꼴 목록은 기본 조각 → 나머지 조각 → 기본 조각의 대체 글꼴(next/font가 만드는
// local(Arial)) 순이어야 합니다(layout.tsx) — 대체 글꼴이 앞이면 나머지 조각의
// 그리스·키릴 문자·기호(™ ↑ ≤ 등)를 Arial이 가로챕니다.
const coreChars = new Set(
  charsInRange(0x20, 0x24f) + // 라틴
    charsInRange(0x2000, 0x206f) + // 문장 부호(공백·따옴표 등 — DB 글에도 흔함)
    charsInRange(0x3000, 0x30ff) + // CJK 기호, 히라가나, 가타카나(일본어 제목)
    [...EXTRA_CORE, ...sourceText]
      .filter((char) => {
        const code = char.codePointAt(0);
        return code >= 0x20 && code <= 0xffff;
      })
      .join(""),
);

if (process.argv.includes("--check-out")) {
  await checkBuildOutput();
} else {
  await generate();
}

async function generate() {
  const lineSeedChars = [
    ...(charsInRange(0x20, HANGUL_FIRST - 1) +
      charsInRange(HANGUL_LAST + 1, 0xd7ff) +
      charsInRange(0xe000, 0xffff)),
    ...hangulChars,
  ];
  const coreText = lineSeedChars
    .filter((char) => coreChars.has(char))
    .sort()
    .join("");
  const restText = lineSeedChars
    .filter((char) => !coreChars.has(char))
    .sort()
    .join("");
  const jobs = [
    ["851MkPOP_101.ttf", "851MkPOP_101.woff2", [...mkpopChars].sort().join("")],
    ["LINESeedKR-Rg.woff2", "LINESeedKR-Rg-core.woff2", coreText],
    ["LINESeedKR-Bd.woff2", "LINESeedKR-Bd-core.woff2", coreText],
    ["LINESeedKR-Rg.woff2", "LINESeedKR-Rg-rest.woff2", restText],
    ["LINESeedKR-Bd.woff2", "LINESeedKR-Bd-rest.woff2", restText],
  ];
  const restCss = lineSeedRestCss();

  // 결과는 아래 입력으로만 정해집니다. next.config.ts가 여러 번 불러도 느려지지
  // 않고, 떠 있는 개발 서버가 폰트 파일 변경으로 다시 로드하지 않도록 같으면 건너뜁니다.
  const hash = createHash("sha256");
  hash.update(await readFile(SCRIPT_PATH));
  hash.update(await readFile(path.join(ROOT, "pnpm-lock.yaml")));
  for (const [source, output, text] of jobs) {
    hash.update(await readFile(path.join(FONT_DIR, source)));
    hash.update(`\0${output}\0${text}\0`);
  }
  hash.update(restCss);
  const inputsHash = hash.digest("hex");

  const upToDate =
    existsSync(HASH_FILE) &&
    (await readFile(HASH_FILE, "utf8")) === inputsHash &&
    jobs.every(([, output]) => existsSync(path.join(SUBSET_DIR, output))) &&
    existsSync(REST_CSS_FILE);
  if (upToDate) return;

  console.log("폰트 서브셋 생성 (src/fonts/subset/)");
  const { default: subsetFont } = await import("subset-font");
  await mkdir(SUBSET_DIR, { recursive: true });
  // 도중에 실패하면 다음 실행이 전부 다시 만들도록 해시부터 지웁니다.
  await rm(HASH_FILE, { force: true });
  for (const [source, output, text] of jobs) {
    const subset = await subsetFont(
      await readFile(path.join(FONT_DIR, source)),
      text,
      {
        targetFormat: "woff2",
        preserveNameIds: PRESERVED_NAME_IDS,
        // 글리프 이름이 없으면 macOS Chrome이 16px 이하 글자의 가로획을 원본과
        // 다르게 그립니다(굵기당 7KB로 원본과 픽셀까지 같아짐).
        glyphNames: true,
      },
    );
    await writeFile(path.join(SUBSET_DIR, output), subset);
    console.log(
      `  ${output.padEnd(22)} ${(subset.length / 1024).toFixed(0).padStart(4)}KB`,
    );
  }
  await writeFile(REST_CSS_FILE, restCss);
  await writeFile(HASH_FILE, inputsHash);
}

/**
 * 나머지 조각의 @font-face. unicode-range는 나머지 조각 후보 블록에서 기본 조각
 * 글자를 뺀 것 — 기본 조각 글자가 범위에 걸리면, 기본 조각을 받는 중일 때 브라우저가
 * 글꼴 목록의 다음 글꼴(이 조각)까지 미리 받기 시작한다. 한자(U+3400–9FFF)는 이
 * 폰트에 없어 넣지 않는다(일본어 제목 때문에 받지 않게). 세로 보정은 layout.tsx의
 * 기본 조각과 같은 값(docs/RULES.md).
 */
function restCodes() {
  const coreCodes = new Set([...coreChars].map((char) => char.codePointAt(0)));
  return codesInRanges(
    [
      [0x250, 0x1fff],
      [0x2070, 0x2fff],
      [0x3100, 0x33ff],
      [0xa000, 0xd7ff],
      [0xe000, 0xffff],
    ],
    coreCodes,
  ).filter(
    (code) =>
      !isHangulSyllable(String.fromCodePoint(code)) ||
      hangulChars.has(String.fromCodePoint(code)),
  );
}

function lineSeedRestCss() {
  const range = toUnicodeRange(restCodes());
  const face = (file, weight) => `@font-face {
  font-family: "LINE Seed KR Rest";
  src: url("./${file}") format("woff2");
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
  ascent-override: 105%;
  descent-override: 27.4%;
  line-gap-override: 0%;
  unicode-range: ${range};
}
`;
  return (
    "/* scripts/subset-fonts.mjs가 만든 파일 — 직접 고치지 마세요. */\n" +
    face("LINESeedKR-Rg-rest.woff2", "400 500") +
    face("LINESeedKR-Bd-rest.woff2", "600 800")
  );
}

// 위 수집은 소스만 봅니다. 다른 형태로 선언한 제목이나 Supabase에서 온 한글이
// 서브셋에서 빠지면 그 글자만 조용히 시스템 폰트로 보이므로, 빌드가 끝난 뒤
// 실제 결과 HTML로 확인하고 빠진 글자가 있으면 빌드를 실패시킵니다.
async function checkBuildOutput() {
  if (!existsSync(BUILD_DIR)) {
    console.error("[폰트 서브셋] out/이 없습니다 — 먼저 빌드하세요.");
    process.exitCode = 1;
    return;
  }

  const missingMkpop = new Map();
  const missingHangul = new Map();
  const restOnlyChars = new Map();
  const restSet = new Set(restCodes());
  const record = (map, char, file) =>
    map.set(char, (map.get(char) ?? new Set()).add(file));

  for (const { file, text } of await readFiles(BUILD_DIR, /\.html$/)) {
    const mkpopElements = text.matchAll(
      /<[a-z0-9]+\b[^>]*\bclass="[^"]*(?<![\w-])font-mkpop(?![\w-])[^"]*"[^>]*>([^<]*)/g,
    );
    for (const [, content] of mkpopElements) {
      for (const char of content.replace(/&[#\w]+;|\s/g, "")) {
        if (!mkpopChars.has(char)) record(missingMkpop, char, file);
      }
    }
    for (const char of new Set(text)) {
      if (isHangulSyllable(char) && !hangulChars.has(char))
        record(missingHangul, char, file);
      else if (restSet.has(char.codePointAt(0)))
        record(restOnlyChars, char, file);
    }
  }
  const describe = (map) =>
    [...map]
      .map(([char, files]) => {
        const shown = [...files].slice(0, 3).join(", ");
        const more = files.size > 3 ? ` 외 ${files.size - 3}곳` : "";
        return `    ${char}  ${shown}${more}`;
      })
      .join("\n");

  // 나머지 조각에 있는 글자는 제대로 보이지만, 그 페이지는 나머지 조각까지 받는다.
  if (restOnlyChars.size > 0) {
    console.warn(
      `\n[폰트 서브셋] 기본 조각에 없는 글자가 빌드 결과에 있습니다(나머지 조각을 더 받음).\n${describe(restOnlyChars)}\n` +
        `  → scripts/subset-fonts.mjs의 EXTRA_CORE에 추가하세요: "${[...restOnlyChars.keys()].join("")}"\n`,
    );
  }
  if (missingMkpop.size + missingHangul.size === 0) return;

  console.error(
    "\n[폰트 서브셋] 빌드 결과에 서브셋 폰트에 없는 글자가 있습니다.",
  );
  if (missingMkpop.size > 0) {
    console.error(
      `  851MkPOP (font-mkpop)\n${describe(missingMkpop)}\n` +
        '  → 곡 제목이면 `jp: "…"` 문자열 하나로 적혀 있는지 확인하세요. 제목이 아닌\n' +
        "    글자라면 scripts/subset-fonts.mjs의 mkpopChars에 그 글자도 모으도록 추가하세요.",
    );
  }
  if (missingHangul.size > 0) {
    console.error(
      `  LINE Seed KR\n${describe(missingHangul)}\n` +
        `  → scripts/subset-fonts.mjs의 EXTRA_CORE에 추가하세요: "${[...missingHangul.keys()].join("")}"`,
    );
  }
  console.error("  고친 뒤 다시 빌드하세요.\n");
  process.exitCode = 1;
}
