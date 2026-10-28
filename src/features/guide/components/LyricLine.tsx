import { Fragment, memo } from "react";
import { cn } from "@/lib/utils";
import type {
  CallTag,
  LyricLine as LyricLineData,
  LyricText,
} from "@/features/guide/lib/types";
import { parseTimestamp } from "@/features/guide/lib/timestamp";
import {
  hasEmphasis,
  parseEmphasis,
  parseIconTokens,
} from "@/features/guide/lib/icon-tokens";
import { CallIcon } from "@/features/guide/components/CallIcon";
import { CLAP, ClapText } from "@/features/guide/components/ClapText";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import {
  getVisibleLineTag,
  type TagRunPosition,
} from "@/features/guide/lib/line-tag";
import { CALL_TAG_COLOR, withAlpha } from "@/features/guide/lib/call-tag-style";

// CallIcon은 align-middle(=부모 baseline + x-height의 절반)로 정렬되는데,
// 이 폰트에서는 그 기준점이 실제 글자의 시각적 중심보다 살짝 아래라서
// (=텍스트가 살짝 높아 보임) 미세하게 내려서 보정. SongList 등 flex로
// 정렬하는 곳은 이 오차가 없으므로 CallIcon 기본값은 그대로 두고, 텍스트와
// 인라인으로 섞이는 이 파일의 호출부에서만 보정.
function InlineCallIcon({ name }: { name: CallTag }) {
  return <CallIcon name={name} className="relative top-[-0.08em]" />;
}

/**
 * pronunciation 등에 쓰는 ** / * / *** 강조 마커 중 지금 이 줄에서 실제로
 * "켜져 있는" 강조 범위. lineTag가 swing/clap/call/dance면 cheer, "slam"이면
 * slam, 태그가 없으면 어느 쪽도 강조하지 않습니다.
 */
type EmphasisScope = "cheer" | "slam";

function getEmphasisScope(tag: CallTag | undefined): EmphasisScope | undefined {
  if (!tag) return undefined;
  return tag === "slam" ? "slam" : "cheer";
}

interface lyricLineProps {
  line: LyricLineData;
  isActive: boolean;
  /**
   * 줄을 클릭했을 때 영상을 `line.time` 지점으로 이동. `seekTo`(초 단위)를
   * 그대로 받아서 내부에서 변환합니다 — LyricsView가 매 렌더마다 새 클로저를
   * 만들어 내려주면 아래 memo가 무력화되므로, 참조가 안정적인 함수를 그대로
   * 전달받는 쪽이 활성 줄이 바뀔 때 이 줄만 리렌더되게 하는 데 필요합니다.
   */
  onSeek?: (seconds: number) => void;
  /**
   * 같은 응원 태그가 이어지는 구간 안에서의 위치(LyricsView가 곡 단위로 계산).
   * 왼쪽 아이콘 칸에 아이콘(구간 첫 줄) / 세로선(이어지는 줄)을 그린다.
   */
  runPosition?: TagRunPosition;
}

const NO_CLAPS: readonly number[] = [];

/** 발음 줄 속 ✋를 박수 타이밍(line.claps) 애니메이션으로 그릴 때 쓰는 값. */
interface ClapTiming {
  lineStart: number;
  times: readonly number[];
  isActive: boolean;
}

function countClaps(text: string): number {
  return text.split(CLAP).length - 1;
}

// 응원 단어(또는 강조 단어가 없는 응원 줄 전체) 표시 — 발음 줄은 따라
// 부를 기준이라 응원 색 형광펜, 나머지(원문·번역·응원 설명)는 장식 없이
// 응원 색 글자로만.
const HIGHLIGHT_CLASS = "rounded-sm box-decoration-clone px-0.5 text-white";
const EMPHASIS_CLASS = "font-bold";

function emphasisProps(color: string, highlight: boolean) {
  return highlight
    ? { className: HIGHLIGHT_CLASS, style: { backgroundColor: `${color}55` } }
    : { className: EMPHASIS_CLASS, style: { color } };
}

// 재생 중인 응원 줄 배경의 알파값 — 응원 색 글자(응원 단어)가 묻히지 않게
// 옅게 깐다.
const ACTIVE_LINE_ALPHA = "2e";

function LyricLineComponent({
  line,
  isActive,
  onSeek,
  runPosition,
}: lyricLineProps) {
  const { visibleTags } = useGuideMode();
  const lineClick = onSeek
    ? () => onSeek(parseTimestamp(line.time))
    : undefined;

  const { tag: lineTag, text: cheerText } = getVisibleLineTag(
    line,
    visibleTags,
  );
  const emphasisScope = getEmphasisScope(lineTag);
  // ♫ 하나만 있는 간주(전주/간주/후주)는 구분선 + 음표 이모지로만 표현한다.
  // 밴드 소개·악기 이름처럼 글자가 있는 간주는 기존 모양 그대로.
  const isMusicBreak =
    !!line.interlude &&
    line.original.trim() === "♫" &&
    !line.pronunciation &&
    !line.translation;

  const content = isMusicBreak ? (
    <>
      <MusicBreak tag={lineTag} isActive={isActive} />
      <CheerText text={cheerText} tag={lineTag} />
    </>
  ) : (
    <>
      {/* 간주 줄은 가운데 정렬이라 왼쪽 아이콘 칸 대신 ♫ 위에 아이콘을 둔다 */}
      {line.interlude && lineTag && !cheerText && (
        <p className="mb-1 flex justify-center">
          <CallIcon name={lineTag} size={20} className="mr-0" />
        </p>
      )}
      <CheerText text={cheerText} tag={lineTag} showIcon={!!line.interlude} />
      <OriginalText text={line.original} tag={lineTag} scope={emphasisScope} />
      <PronunciationText
        text={line.pronunciation}
        tag={lineTag}
        scope={emphasisScope}
        // 박수(✋)는 따라 부르는 발음 줄에 적는다. 타이밍(claps)이 없어도
        // ClapText로 그려서 ✋ 사이 간격 표기(공백 / 슬래시)를 같은 규칙으로 보여준다.
        clap={{
          lineStart: parseTimestamp(line.time),
          times: line.claps ?? NO_CLAPS,
          isActive,
        }}
      />
      <TranslationText
        text={line.translation}
        tag={lineTag}
        scope={emphasisScope}
      />
    </>
  );

  // 응원 줄도 줄 전체 배경은 칠하지 않는다 — 응원 설명은 배지로, 실제로
  // 응원하는 단어만 응원 색 글자로 표시(CheerText / renderTextParts 참고).
  // 간주가 아닌 줄은 [아이콘 칸 | 본문] 두 칸 그리드 — 아이콘 칸은 비어
  // 있어도 자리를 차지해서 가사 시작 위치가 모든 줄에서 같고, 아이콘(재생
  // 점)은 본문 첫 줄(배지든 원문이든) 높이의 세로 가운데에 자동으로 맞는다.
  const body = line.interlude ? (
    content
  ) : (
    <div
      className={cn(
        "grid grid-cols-[1.375rem_minmax(0,1fr)] gap-x-2 [&>*]:col-start-2",
        // 태블릿 이상은 아이콘(28px) 둘레에 여백을 둬서 본문과 더 띄운다.
        "tablet:grid-cols-[2.25rem_minmax(0,1fr)] tablet:gap-x-3",
      )}
    >
      <span
        aria-hidden
        // 높이 0인 칸의 세로 가운데에 표시만 넘쳐 보이게 — 아이콘이 줄
        // 높이를 늘리지 않아서 아이콘 유무·재생 여부와 상관없이 줄 크기가 같다.
        className="relative col-start-1! row-start-1 flex h-0 items-center justify-center self-center overflow-visible"
      >
        {lineTag && runPosition && (
          <GutterMarker
            tag={lineTag}
            position={runPosition}
            isActive={isActive}
          />
        )}
      </span>
      {content}
    </div>
  );

  // 응원 줄도 줄 전체 배경은 칠하지 않는다 — 응원 설명은 배지로, 실제로
  // 응원하는 단어만 응원 색 글자로 표시(CheerText / renderTextParts 참고).
  return (
    <li
      data-active={isActive || undefined}
      data-time={line.time}
      data-call-tag={lineTag}
      className={cn(
        "group relative transition-colors hover:bg-white/10",
        lineClick && "cursor-pointer",
        line.interlude
          ? cn("px-5 text-center", isMusicBreak ? "my-2 py-3" : "my-4 py-6")
          : "py-3 pr-5 pl-4 text-left",
        // 재생 중인 줄: 테두리 없이 옅은 배경 + 흰 글자. 응원 줄은 그 응원
        // 색, 아니면 보라. 재생 중이 아닌 줄은 LyricsView가 글자를 흐리게
        // 해서 차이를 키운다. 글자 굵기는 바꾸지 않는다 — 굵어지면 글자 폭이
        // 넓어져 줄이 바뀔 때마다 가사가 옆으로 흔들려 보인다.
        isActive && "text-white",
        isActive && !lineTag && "bg-ztmy-purple/25",
      )}
      style={
        isActive && lineTag
          ? { backgroundColor: withAlpha(lineTag, ACTIVE_LINE_ALPHA) }
          : undefined
      }
    >
      {!line.interlude && lineTag && runPosition && (
        <RunLine tag={lineTag} position={runPosition} isActive={isActive} />
      )}
      {lineClick ? (
        <button
          type="button"
          onClick={lineClick}
          className={cn(
            // block: 버튼은 기본이 inline-block이라 안쪽 그리드 첫 칸(아이콘 칸)의
            // 글자 기준선에 맞춰 줄에 놓인다 — 아이콘 칸이 비었을 때(구간 안 줄이
            // 재생 중이 아닐 때)와 아이콘이 생겼을 때 기준선이 달라져, 재생될
            // 때마다 줄 높이가 6~8px 줄었다 늘었다 하며 흔들려 보였다.
            "block w-full group-hover:cursor-pointer",
            line.interlude ? "text-center" : "text-left",
          )}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}

/**
 * 재생 중 250ms마다 activeLineIndex가 갱신되며 LyricsView가 가사 줄 전체를
 * 다시 렌더링하는데, isActive가 실제로 바뀐 1~2줄만 다시 그리도록
 * memo로 막습니다 (line/onSeek는 참조가 안정적이라 얕은 비교로 충분).
 */
export const LyricLine = memo(LyricLineComponent);

/****** 음표 간주 ******/
// ── ♫ ── 구분선. 재생 중이면 음표가 ♪♫♪ 셋으로 늘어나 박자 타듯 번갈아
// 들썩이고, 양쪽 구분선이 분홍빛으로 밝아진다. 응원 태그가 있으면 음표 옆에
// 아이콘(배지 설명은 그 아래).
// 음표 셋을 늘 그려 두고 재생 중이 아닐 땐 양옆 ♪만 감춘다 — 개수가
// 바뀌면 가운데 폭이 달라져 양옆 구분선이 늘었다 줄었다 흔들린다.
const MUSIC_BREAK_NOTES = ["♪", "♫", "♪"];

function MusicBreak({ tag, isActive }: { tag?: CallTag; isActive: boolean }) {
  return (
    <p
      role="img"
      aria-label="간주"
      className={cn("flex items-center gap-3", tag && "mb-1.5")}
    >
      <span
        aria-hidden
        className={cn(
          "h-px flex-1 bg-linear-to-r from-transparent transition-colors duration-500",
          isActive
            ? "to-ztmy-pink shadow-[0_0_6px_rgba(220,131,188,0.8)]"
            : "to-white/25",
        )}
      />
      <span aria-hidden className="flex items-center gap-1.5">
        {tag && <CallIcon name={tag} size={20} className="mr-0" />}
        {MUSIC_BREAK_NOTES.map((note, index) => (
          <span
            key={index}
            className={cn(
              "inline-block text-lg leading-none",
              isActive
                ? "text-ztmy-pink motion-safe:animate-[note-bob_0.9s_ease-in-out_infinite]"
                : "text-white/50",
              !isActive && index !== 1 && "invisible",
            )}
            style={
              isActive ? { animationDelay: `${index * 0.15}s` } : undefined
            }
          >
            {note}
          </span>
        ))}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1 bg-linear-to-l from-transparent transition-colors duration-500",
          isActive
            ? "to-ztmy-pink shadow-[0_0_6px_rgba(220,131,188,0.8)]"
            : "to-white/25",
        )}
      />
    </p>
  );
}

/****** 왼쪽 아이콘 칸 ******/
// 같은 태그가 이어지는 구간을 줄 높이 전체에 걸친 응원 색 세로선으로 잇는다.
// 칸 위치(왼쪽 16px = 줄의 pl-4, 폭 모바일 22px / 태블릿 이상 36px)는 위
// 그리드의 아이콘 칸과 같아야 한다.
function RunLine({
  tag,
  position,
  isActive,
}: {
  tag: CallTag;
  position: TagRunPosition;
  isActive: boolean;
}) {
  if (position === "single") return null;

  // 구간 첫 줄은 아이콘 아래(top-10)부터. 이어지는 줄은 줄 높이 전체인데,
  // 재생 중엔 그 줄에도 아이콘이 떠서 아이콘 자리(8px~40px)만 비운다.
  const bottom = position === "end" ? "bottom-4" : "bottom-0";
  const segments =
    position === "start"
      ? ["top-10 bottom-0"]
      : isActive
        ? ["top-0 h-2", `top-10 ${bottom}`]
        : [`top-0 ${bottom}`];

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 left-4 w-5.5",
        "tablet:w-9",
      )}
    >
      {segments.map((segment) => (
        <span
          key={segment}
          className={cn(
            "absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full",
            segment,
          )}
          style={{ backgroundColor: withAlpha(tag, "99") }}
        />
      ))}
    </span>
  );
}

// 재생 중 아이콘 강조 — 동작마다 다르게. 흔들기는 샤모지가 좌우로 흔들리고,
// 떼창은 소리치듯 커졌다 돌아오고, 댄스는 좌우로 통통 튀며 몸을 흔든다
// (globals.css call-swing / call-shout / call-dance).
// 박수·슬램은 아이콘은 그대로 두고 퍼지는 고리(PingRing)로.
const ACTIVE_ICON_MOTION: Partial<Record<CallTag, string>> = {
  swing:
    "origin-bottom motion-safe:animate-[call-swing_0.7s_ease-in-out_infinite]",
  call: "motion-safe:animate-[call-shout_0.8s_ease-in-out_infinite]",
  dance: "motion-safe:animate-[call-dance_0.9s_ease-in-out_infinite]",
};

// 아이콘은 구간 첫 줄(또는 홀로 있는 응원 줄)에 늘 보이고, 구간 안 이어지는
// 줄엔 재생 중일 때만 뜬다. 재생 중이면 배경 없이 동작별 애니메이션 + 응원
// 색 빛으로 강조한다. 크기는 재생 여부와 상관없이 그대로(모바일 22px,
// 태블릿 이상 28px).
function GutterMarker({
  tag,
  position,
  isActive,
}: {
  tag: CallTag;
  position: TagRunPosition;
  isActive: boolean;
}) {
  const isRunHead = position === "start" || position === "single";
  if (!isRunHead && !isActive) return null;

  const color = CALL_TAG_COLOR[tag];
  const motion = ACTIVE_ICON_MOTION[tag];

  return (
    <span
      className={cn(
        "relative flex size-5.5 shrink-0 items-center justify-center",
        "tablet:size-7",
      )}
    >
      {isActive && !motion && (
        <PingRing color={color} size={cn("size-8", "tablet:size-10")} />
      )}
      <span
        className={cn("relative flex", isActive && motion)}
        style={
          isActive ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined
        }
      >
        <CallIcon
          name={tag}
          size={28}
          className={cn("mr-0", "max-tablet:size-5.5!")}
        />
      </span>
    </span>
  );
}

/** 바깥으로 계속 퍼져 나가는 응원 색 고리(재생 중 강조 애니메이션). */
function PingRing({ color, size }: { color: string; size: string }) {
  return (
    <span
      className={cn(
        "absolute rounded-full border-2 motion-safe:animate-ping",
        size,
      )}
      style={{ borderColor: `${color}aa` }}
    />
  );
}

/****** 응원법 ******/
function CheerText({
  text,
  tag,
  showIcon,
}: {
  text?: string;
  tag?: CallTag;
  /** 왼쪽 아이콘 칸이 없는 줄(간주)에서만 배지 안에 아이콘을 넣는다 */
  showIcon?: boolean;
}) {
  if (!text) return null;

  if (!tag) {
    return (
      <p
        data-role="cheer"
        className="text-sm leading-relaxed font-bold text-[silver]"
      >
        {renderTextParts(text, "cheer")}
      </p>
    );
  }

  // 응원 설명: 설명만 응원 색 글자로(배경 장식 없음). 응원 종류는 왼쪽 아이콘과
  // 글자 색이 이미 알려줘서 이름("흔들기" 등)은 앞에 붙이지 않는다. 간주 줄은
  // 아이콘 칸이 없어 설명 앞에 아이콘만 넣는다.
  return (
    <p data-role="cheer" className="mb-1">
      <span
        className="inline-flex max-w-full items-center gap-x-1.5 text-left text-sm leading-relaxed font-bold"
        style={{ color: CALL_TAG_COLOR[tag] }}
      >
        {showIcon && <CallIcon name={tag} size={18} className="mr-0" />}
        <span>{renderTextParts(text, "cheer")}</span>
      </span>
    </p>
  );
}

/****** 일어 가사 ******/
function OriginalText({
  text,
  tag,
  scope,
}: {
  text: string;
  tag?: CallTag;
  scope?: EmphasisScope;
}) {
  if (!text && !tag) return null;

  const emphasisColor = tag ? CALL_TAG_COLOR[tag] : undefined;

  return (
    <p data-role="original" className="pc:text-base text-sm">
      {renderTextParts(text, "original", scope, emphasisColor)}
    </p>
  );
}

/****** 발음 가사 ******/
function PronunciationText({
  text,
  tag,
  scope,
  clap,
}: {
  text: LyricText;
  tag?: CallTag;
  scope?: EmphasisScope;
  clap: ClapTiming;
}) {
  if (!text) return null;

  const emphasisColor = tag ? CALL_TAG_COLOR[tag] : undefined;
  const content = (
    <LyricTextRenderer
      text={text}
      prefix="pron"
      highlight
      clap={clap}
      scope={scope}
      emphasisColor={emphasisColor}
    />
  );

  // 응원 줄인데 강조할 단어(** / ^)를 따로 적지 않았으면 줄 전체가 응원
  // 구간이라는 뜻 — 발음 줄 전체에 형광펜을 칠한다.
  const plainText =
    typeof text === "string" ? text : text.map((seg) => seg.text).join("");
  const highlightWholeLine =
    !!emphasisColor && !!scope && !hasEmphasis(plainText, scope);

  return (
    <p data-role="pronunciation" className="wide:text-xl pc:text-lg text-base">
      {highlightWholeLine ? (
        <strong {...emphasisProps(emphasisColor, true)}>{content}</strong>
      ) : (
        content
      )}
    </p>
  );
}

/****** 한국어 가사 ******/
function TranslationText({
  text,
  tag,
  scope,
}: {
  text: string;
  tag?: CallTag;
  scope?: EmphasisScope;
}) {
  if (!text) return null;

  const emphasisColor = tag ? CALL_TAG_COLOR[tag] : undefined;

  return (
    <p data-role="translation" className="pc:text-sm text-xs">
      {renderTextParts(text, "translation", scope, emphasisColor)}
    </p>
  );
}

// ==================== 텍스트 렌더링 헬퍼 ==================== //
function LyricTextRenderer({
  text,
  prefix,
  scope,
  emphasisColor,
  highlight = false,
  clap,
}: {
  text: LyricText;
  prefix: string;
  scope?: EmphasisScope;
  emphasisColor?: string;
  highlight?: boolean;
  clap?: ClapTiming;
}) {
  if (typeof text === "string") {
    return (
      <>
        {renderTextParts(text, prefix, scope, emphasisColor, highlight, {
          clap,
          clapStart: 0,
        })}
      </>
    );
  }

  // 구간마다 따로 그리지만 ✋ 순서(claps 인덱스)는 줄 전체로 이어진다 —
  // 각 구간이 몇 번째 ✋부터 시작하는지 미리 센다.
  const clapStarts = text.map((_, index) =>
    text
      .slice(0, index)
      .reduce((sum, segment) => sum + countClaps(segment.text), 0),
  );
  return (
    <>
      {text.map((segment, index) => (
        <span key={`${prefix}-seg-${index}`} data-call-tag={segment.tag}>
          {renderTextParts(
            segment.text,
            `${prefix}-seg-${index}`,
            scope,
            emphasisColor,
            highlight,
            { clap, clapStart: clapStarts[index] },
          )}
        </span>
      ))}
    </>
  );
}

function renderTextParts(
  text: string,
  key: string,
  scope?: EmphasisScope,
  emphasisColor?: string,
  highlight = false,
  claps?: { clap?: ClapTiming; clapStart: number },
) {
  // ✋가 든 조각은 ClapText로 — claps 인덱스는 조각을 넘어 앞에서부터 이어진다.
  let clapCursor = claps?.clapStart ?? 0;
  const renderValue = (value: string, valueKey: string) => {
    const clap = claps?.clap;
    if (!clap || !value.includes(CLAP)) return value;
    const start = clapCursor;
    clapCursor += countClaps(value);
    return (
      <ClapText
        key={valueKey}
        text={value}
        lineStart={clap.lineStart}
        claps={clap.times.slice(start, clapCursor)}
        isActive={clap.isActive}
      />
    );
  };

  return parseIconTokens(text).map((part, index) => {
    if (part.type === "icon") {
      return <InlineCallIcon key={`${key}-${index}`} name={part.value} />;
    }

    return (
      <Fragment key={`${key}-${index}`}>
        {parseEmphasis(part.value).map((seg, segIndex) => {
          if (seg.type !== "emphasis") {
            return (
              <Fragment key={`${key}-${index}-${segIndex}`}>
                {renderValue(seg.value, `${key}-${index}-${segIndex}-clap`)}
              </Fragment>
            );
          }

          // 이 강조 마커가 감싼 범위(cheer/slam)가 지금 활성화된 가이드
          // 모드와 다르면, 표시만 안 할 뿐 텍스트 자체는 평범하게 보여줍니다.
          const applies =
            scope === "cheer" ? seg.cheer : scope === "slam" ? seg.slam : false;

          if (!applies) {
            return (
              <Fragment key={`${key}-${index}-${segIndex}`}>
                {renderValue(seg.value, `${key}-${index}-${segIndex}-clap`)}
              </Fragment>
            );
          }

          return (
            // 실제로 응원하는 단어만 응원 색으로(발음 줄은 형광펜).
            <strong
              key={`${key}-${index}-${segIndex}`}
              {...(emphasisColor && emphasisProps(emphasisColor, highlight))}
            >
              {renderValue(seg.value, `${key}-${index}-${segIndex}-clap`)}
            </strong>
          );
        })}
      </Fragment>
    );
  });
}
