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
import { ClapText } from "@/features/guide/components/ClapText";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import {
  getVisibleLineTag,
  type TagRunPosition,
} from "@/features/guide/lib/line-tag";
import {
  CALL_TAG_COLOR,
  CALL_TAG_LABEL,
  withAlpha,
} from "@/features/guide/lib/call-tag-style";

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
 * "켜져 있는" 강조 범위. lineTag가 swing/clap/call이면 cheer, "slam"이면
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

// 응원 단어(또는 강조 단어가 없는 응원 줄 전체)에 칠하는 형광펜
const HIGHLIGHT_CLASS = "rounded-sm box-decoration-clone px-0.5 text-white";
function highlightColor(color: string) {
  return `${color}55`;
}

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
      <OriginalText
        text={line.original}
        tag={lineTag}
        scope={emphasisScope}
        clap={
          // ✋가 있는 줄은 타이밍(claps)이 없어도 ClapText로 그린다 — ✋ 사이
          // 간격 표기(공백 / 슬래시)를 항상 같은 규칙으로 보여주기 위함.
          line.original.includes("✋")
            ? {
                lineStart: parseTimestamp(line.time),
                times: line.claps ?? NO_CLAPS,
                isActive,
              }
            : undefined
        }
      />
      <PronunciationText
        text={line.pronunciation}
        tag={lineTag}
        scope={emphasisScope}
      />
      <TranslationText
        text={line.translation}
        tag={lineTag}
        scope={emphasisScope}
      />
    </>
  );

  // 응원 줄도 줄 전체 배경은 칠하지 않는다 — 응원 설명은 배지로, 실제로
  // 응원하는 단어만 형광펜으로 표시(CheerText / renderTextParts 참고).
  // 간주가 아닌 줄은 [아이콘 칸 | 본문] 두 칸 그리드 — 아이콘 칸은 비어
  // 있어도 자리를 차지해서 가사 시작 위치가 모든 줄에서 같고, 아이콘(재생
  // 점)은 본문 첫 줄(배지든 원문이든) 높이의 세로 가운데에 자동으로 맞는다.
  const body = line.interlude ? (
    content
  ) : (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 [&>*]:col-start-2">
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
  // 응원하는 단어만 형광펜으로 표시(CheerText / renderTextParts 참고).
  return (
    <li
      data-active={isActive || undefined}
      data-time={line.time}
      data-call-tag={lineTag}
      className={cn(
        "group relative transition-colors hover:bg-white/10",
        lineClick && "cursor-pointer",
        line.interlude
          ? cn("px-3 text-center", isMusicBreak ? "my-2 py-3" : "my-4 py-6")
          : "py-3 pr-3 pl-2 text-left",
        // 재생 중인 줄: 테두리 없이 밝은 보라 배경 + 흰 글자. 재생 중이
        // 아닌 줄은 LyricsView가 글자를 흐리게 해서 차이를 키운다.
        isActive && "bg-ztmy-purple/25 font-semibold text-white",
      )}
    >
      {!line.interlude && lineTag && runPosition && (
        <RunLine tag={lineTag} position={runPosition} />
      )}
      {lineClick ? (
        <button
          type="button"
          onClick={lineClick}
          className={cn(
            "w-full group-hover:cursor-pointer",
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
function MusicBreak({ tag, isActive }: { tag?: CallTag; isActive: boolean }) {
  const notes = isActive ? ["♪", "♫", "♪"] : ["♫"];

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
        {notes.map((note, index) => (
          <span
            key={`${note}-${index}`}
            className={cn(
              "inline-block text-lg leading-none",
              isActive
                ? "text-ztmy-pink motion-safe:animate-[note-bob_0.9s_ease-in-out_infinite]"
                : "text-white/50",
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
// 칸 위치(왼쪽 8px, 폭 32px)는 위 그리드의 아이콘 칸과 같아야 한다.
function RunLine({
  tag,
  position,
}: {
  tag: CallTag;
  position: TagRunPosition;
}) {
  if (position === "single") return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-2 w-8"
    >
      <span
        className={cn(
          "absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full",
          position === "start" && "top-10 bottom-0",
          position === "middle" && "top-0 bottom-0",
          position === "end" && "top-0 bottom-4",
        )}
        style={{ backgroundColor: withAlpha(tag, "99") }}
      />
    </span>
  );
}

// 구간 첫 줄(또는 홀로 있는 응원 줄)은 아이콘, 구간 안 이어지는 줄은 재생
// 중일 때만 세로선 위 재생 점. 재생 중이면 응원 색 후광 + 퍼지는 고리로 강조.
function GutterMarker({
  tag,
  position,
  isActive,
}: {
  tag: CallTag;
  position: TagRunPosition;
  isActive: boolean;
}) {
  const color = CALL_TAG_COLOR[tag];

  if (position === "start" || position === "single") {
    return (
      // 아이콘은 처음부터 강조 크기(32px)로 그리고 재생 중에도 크기는 그대로 —
      // 강조는 후광 + 퍼지는 고리 + 빛으로만 한다.
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        {isActive && <ActiveHalo color={color} size="h-11 w-11" />}
        <span
          className="relative flex"
          style={
            isActive ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined
          }
        >
          <CallIcon name={tag} size={32} className="mr-0" />
        </span>
      </span>
    );
  }

  if (!isActive) return null;

  return (
    <span className="relative flex h-2.5 w-8 shrink-0 items-center justify-center">
      <ActiveHalo color={color} size="h-5 w-5" />
      <span
        className="relative h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}` }}
      />
    </span>
  );
}

/** 재생 중 표시: 응원 색 원형 후광 + 바깥으로 계속 퍼져 나가는 고리. */
function ActiveHalo({ color, size }: { color: string; size: string }) {
  return (
    <>
      <span
        className={cn("absolute rounded-full", size)}
        style={{ backgroundColor: `${color}40` }}
      />
      <span
        className={cn(
          "absolute rounded-full border-2 motion-safe:animate-ping",
          size,
        )}
        style={{ borderColor: `${color}aa` }}
      />
    </>
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

  // 응원 설명 배지: 아이콘 + 종류 이름 + 설명
  return (
    <p data-role="cheer" className="mb-1.5">
      <span
        className={cn(
          "inline-flex max-w-full flex-wrap items-center gap-x-1.5 rounded-2xl border px-2.5 py-0.5 text-left",
          "text-sm leading-relaxed font-bold",
        )}
        style={{
          color: CALL_TAG_COLOR[tag],
          backgroundColor: withAlpha(tag, "1f"),
          borderColor: withAlpha(tag, "80"),
        }}
      >
        <span className="inline-flex shrink-0 items-center whitespace-nowrap">
          {showIcon && <CallIcon name={tag} size={18} />}
          {CALL_TAG_LABEL[tag]}
        </span>
        <span aria-hidden>·</span>
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
  clap,
}: {
  text: string;
  tag?: CallTag;
  scope?: EmphasisScope;
  /** line.claps가 있는 줄 — 원문 속 ✋를 박수 타이밍 애니메이션으로 그린다 */
  clap?: { lineStart: number; times: readonly number[]; isActive: boolean };
}) {
  if (!text && !tag) return null;

  const emphasisColor = tag ? CALL_TAG_COLOR[tag] : undefined;

  return (
    <p data-role="original" className="wide:text-base pc:text-sm text-xs">
      {clap ? (
        <ClapText
          text={text}
          lineStart={clap.lineStart}
          claps={clap.times}
          isActive={clap.isActive}
        />
      ) : (
        renderTextParts(text, "original", scope, emphasisColor)
      )}
    </p>
  );
}

/****** 발음 가사 ******/
function PronunciationText({
  text,
  tag,
  scope,
}: {
  text: LyricText;
  tag?: CallTag;
  scope?: EmphasisScope;
}) {
  if (!text) return null;

  const emphasisColor = tag ? CALL_TAG_COLOR[tag] : undefined;
  const content = (
    <LyricTextRenderer
      text={text}
      prefix="pron"
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
    <p data-role="pronunciation" className="wide:text-xl pc:text-base text-sm">
      {highlightWholeLine ? (
        <strong
          className={HIGHLIGHT_CLASS}
          style={{ backgroundColor: highlightColor(emphasisColor) }}
        >
          {content}
        </strong>
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
    <p data-role="translation" className="wide:text-base pc:text-sm text-xs">
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
}: {
  text: LyricText;
  prefix: string;
  scope?: EmphasisScope;
  emphasisColor?: string;
}) {
  if (typeof text === "string") {
    return <>{renderTextParts(text, prefix, scope, emphasisColor)}</>;
  }

  return (
    <>
      {text.map((segment, index) => (
        <span key={`${prefix}-seg-${index}`} data-call-tag={segment.tag}>
          {renderTextParts(
            segment.text,
            `${prefix}-seg-${index}`,
            scope,
            emphasisColor,
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
) {
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
                {seg.value}
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
                {seg.value}
              </Fragment>
            );
          }

          return (
            // 실제로 응원하는 단어에만 응원 색 형광펜을 칠한다.
            <strong
              key={`${key}-${index}-${segIndex}`}
              className={cn(emphasisColor && HIGHLIGHT_CLASS)}
              style={
                emphasisColor
                  ? { backgroundColor: highlightColor(emphasisColor) }
                  : undefined
              }
            >
              {seg.value}
            </strong>
          );
        })}
      </Fragment>
    );
  });
}
