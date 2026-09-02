import { Fragment, memo } from "react";
import { cn } from "@/lib/utils";
import type {
  CallTag,
  LyricLine as LyricLineData,
  LyricText,
} from "@/features/guide/lib/types";
import { parseTimestamp } from "@/features/guide/lib/timestamp";
import {
  parseEmphasis,
  parseIconTokens,
} from "@/features/guide/lib/icon-tokens";
import { CallIcon } from "@/features/guide/components/CallIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";

// 테두리색
const TAG_BORDER_COLOR: Record<CallTag, string> = {
  call: "#f97316",
  swing: "#82fa2a",
  clap: "#6dd6fc",
  slam: "#ef4444",
};

// 배경색 (테두리 색에 알파값만 추가) — 활성 줄은 18%, 비활성 줄은 6%
function getTagBackgroundColor(tag: CallTag, isActive: boolean) {
  return `${TAG_BORDER_COLOR[tag]}${isActive ? "35" : "20"}`;
}

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
}

function LyricLineComponent({ line, isActive, onSeek }: lyricLineProps) {
  const { visibleTags } = useGuideMode();
  const lineClick = onSeek
    ? () => onSeek(parseTimestamp(line.time))
    : undefined;

  // cheer(swing/clap/call)와 slam은 서로 독립적인 필드라 한 줄에 둘 다 있을
  // 수 있습니다 — 이 가이드 모드(visibleTags)가 어느 쪽을 보여줄 차례인지로
  // 결정합니다. 두 모드의 visibleTags는 항상 겹치지 않으므로 동시에 둘 다
  // 노출되는 경우는 없습니다.
  const rawCheerTag =
    typeof line.cheer === "string" ? undefined : line.cheer?.tag;
  const cheerTagVisible = !!rawCheerTag && visibleTags.includes(rawCheerTag);
  const slamVisible = line.slam !== undefined && visibleTags.includes("slam");

  const lineTag: CallTag | undefined = cheerTagVisible
    ? rawCheerTag
    : slamVisible
      ? "slam"
      : undefined;
  const cheerText = cheerTagVisible
    ? typeof line.cheer === "string"
      ? line.cheer
      : line.cheer?.text
    : slamVisible
      ? line.slam
      : undefined;
  const lineStyle = lineTag
    ? ({
        "--tag-border": isActive ? TAG_BORDER_COLOR[lineTag] : "transparent",
        "--tag-bg": getTagBackgroundColor(lineTag, isActive),
      } as React.CSSProperties)
    : undefined;
  const emphasisScope = getEmphasisScope(lineTag);

  const content = (
    <>
      <CheerText text={cheerText} tag={lineTag} />
      <OriginalText text={line.original} tag={lineTag} scope={emphasisScope} />
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

  return (
    <li
      data-active={isActive || undefined}
      data-time={line.time}
      data-call-tag={lineTag}
      className={cn(
        "group border border-transparent px-3 transition-colors hover:bg-white/10",
        lineClick && "cursor-pointer",
        line.interlude ? "py-6 text-center" : "py-3 text-left",
        lineTag && "border-(--tag-border)! bg-(--tag-bg)", // 인라인 style로 backgroundColor를 직접 주면 hover:bg-* 클래스를 항상 덮어써버리므로, CSS 변수 + 임의값 클래스로 우회해 hover가 이길 수 있게 함
        isActive && "font-semibold",
        isActive && !lineTag && "border-ztmy-purple! bg-ztmy-dark/80 border",
      )}
      style={lineStyle}
    >
      {lineClick ? (
        <button
          type="button"
          onClick={lineClick}
          className={cn(
            "w-full group-hover:cursor-pointer",
            line.interlude ? "text-center" : "text-left",
          )}
        >
          {content}
        </button>
      ) : (
        content
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

/****** 응원법 ******/
function CheerText({ text, tag }: { text?: string; tag?: CallTag }) {
  if (!text) return null;

  return (
    <p
      data-role="cheer"
      className="tablet:text-sm text-xs font-bold"
      style={tag ? { color: TAG_BORDER_COLOR[tag] } : { color: "silver" }}
    >
      {renderTextParts(text, "cheer")}
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

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

  return (
    <p data-role="original" className="wide:text-base pc:text-sm text-xs">
      {tag ? <InlineCallIcon name={tag} /> : null}
      {renderTextParts(text, "original", scope, emphasisColor)}
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

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

  return (
    <p data-role="pronunciation" className="wide:text-xl pc:text-base text-sm">
      <LyricTextRenderer
        text={text}
        prefix="pron"
        scope={scope}
        emphasisColor={emphasisColor}
      />
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

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

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
            <strong
              key={`${key}-${index}-${segIndex}`}
              style={emphasisColor ? { color: emphasisColor } : undefined}
            >
              {seg.value}
            </strong>
          );
        })}
      </Fragment>
    );
  });
}
