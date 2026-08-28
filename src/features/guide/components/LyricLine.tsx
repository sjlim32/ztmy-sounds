import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type {
  CallTag,
  LyricLine as LyricLineData,
  LyricText,
} from "@/features/guide/lib/types";
import {
  parseEmphasis,
  parseIconTokens,
} from "@/features/guide/lib/icon-tokens";
import { CallIcon } from "@/features/guide/components/CallIcon";

// 테두리색
const TAG_BORDER_COLOR: Record<CallTag, string> = {
  call: "#f97316",
  swing: "#82fa2a",
  clap: "#6dd6fc",
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

interface lyricLineProps {
  line: LyricLineData;
  isActive: boolean;
  lineClick?: () => void; // 줄을 클릭했을 때 영상을 `line.time` 지점으로 이동
}

export function LyricLine({ line, isActive, lineClick }: lyricLineProps) {
  const cheerText =
    typeof line.cheer === "string" ? line.cheer : line.cheer?.text;
  const lineTag = typeof line.cheer === "string" ? undefined : line.cheer?.tag;
  const lineStyle = lineTag
    ? ({
        "--tag-border": isActive ? TAG_BORDER_COLOR[lineTag] : "transparent",
        "--tag-bg": getTagBackgroundColor(lineTag, isActive),
      } as React.CSSProperties)
    : undefined;

  const content = (
    <>
      <CheerText text={cheerText} tag={lineTag} />
      <OriginalText text={line.original} tag={lineTag} />
      <PronunciationText text={line.pronunciation} tag={lineTag} />
      <TranslationText text={line.translation} tag={lineTag} />
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

/****** 응원법 ******/
function CheerText({ text, tag }: { text?: string; tag?: CallTag }) {
  if (!text) return null;

  return (
    <p
      data-role="cheer"
      className="tablet:text-sm text-xs"
      style={tag ? { color: TAG_BORDER_COLOR[tag] } : { color: "silver" }}
    >
      {renderTextParts(text, "cheer")}
    </p>
  );
}

/****** 일어 가사 ******/
function OriginalText({ text, tag }: { text: string; tag?: CallTag }) {
  if (!text && !tag) return null;

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

  return (
    <p data-role="original" className="wide:text-base pc:text-sm text-xs">
      {tag ? <InlineCallIcon name={tag} /> : null}
      {renderTextParts(text, "original", emphasisColor)}
    </p>
  );
}

/****** 발음 가사 ******/
function PronunciationText({ text, tag }: { text: LyricText; tag?: CallTag }) {
  if (!text) return null;

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

  return (
    <p data-role="pronunciation" className="wide:text-xl pc:text-base text-sm">
      <LyricTextRenderer
        text={text}
        prefix="pron"
        emphasisColor={emphasisColor}
      />
    </p>
  );
}

/****** 한국어 가사 ******/
function TranslationText({ text, tag }: { text: string; tag?: CallTag }) {
  if (!text) return null;

  const emphasisColor = tag ? TAG_BORDER_COLOR[tag] : undefined;

  return (
    <p data-role="translation" className="wide:text-base pc:text-sm text-xs">
      {renderTextParts(text, "translation", emphasisColor)}
    </p>
  );
}

// ==================== 텍스트 렌더링 헬퍼 ==================== //
function LyricTextRenderer({
  text,
  prefix,
  emphasisColor,
}: {
  text: LyricText;
  prefix: string;
  emphasisColor?: string;
}) {
  if (typeof text === "string") {
    return <>{renderTextParts(text, prefix, emphasisColor)}</>;
  }

  return (
    <>
      {text.map((segment, index) => (
        <span key={`${prefix}-seg-${index}`} data-call-tag={segment.tag}>
          {renderTextParts(
            segment.text,
            `${prefix}-seg-${index}`,
            emphasisColor,
          )}
        </span>
      ))}
    </>
  );
}

function renderTextParts(text: string, key: string, emphasisColor?: string) {
  return parseIconTokens(text).map((part, index) => {
    if (part.type === "icon") {
      return <InlineCallIcon key={`${key}-${index}`} name={part.value} />;
    }

    return (
      <Fragment key={`${key}-${index}`}>
        {parseEmphasis(part.value).map((seg, segIndex) =>
          seg.type === "emphasis" ? (
            <strong
              key={`${key}-${index}-${segIndex}`}
              style={emphasisColor ? { color: emphasisColor } : undefined}
            >
              {seg.value}
            </strong>
          ) : (
            <Fragment key={`${key}-${index}-${segIndex}`}>{seg.value}</Fragment>
          ),
        )}
      </Fragment>
    );
  });
}
