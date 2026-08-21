import { Fragment } from "react";
import clsx from "clsx";
import type {
  CallTag,
  LyricLine as LyricLineData,
  LyricText,
} from "@/lib/guide/types";
import { parseIconTokens } from "@/lib/guide/icon-tokens";
import { CallIcon } from "@/components/guide/detail/CallIcon";

// 테두리색
const TAG_BORDER_COLOR: Record<CallTag, string> = {
  call: "#f97316",
  swing: "#82fa2a",
  clap: "#6dd6fc",
};

// 배경색 (테두리의 약 18%)
const TAG_BACKGROUND_COLOR: Record<CallTag, string> = {
  call: `${TAG_BORDER_COLOR.call}30`,
  swing: `${TAG_BORDER_COLOR.swing}30`,
  clap: `${TAG_BORDER_COLOR.clap}30`,
};

function renderTextParts(text: string, key: string) {
  return parseIconTokens(text).map((part, index) =>
    part.type === "icon" ? (
      <CallIcon key={`${key}-${index}`} name={part.value} />
    ) : (
      <Fragment key={`${key}-${index}`}>{part.value}</Fragment>
    ),
  );
}

function LyricTextRenderer({
  text,
  prefix,
}: {
  text: LyricText;
  prefix: string;
}) {
  if (typeof text === "string") {
    return <>{renderTextParts(text, prefix)}</>;
  }

  return (
    <>
      {text.map((segment, index) => (
        <span key={`${prefix}-seg-${index}`} data-call-tag={segment.tag}>
          {renderTextParts(segment.text, `${prefix}-seg-${index}`)}
        </span>
      ))}
    </>
  );
}

function CheerText({ text, tag }: { text?: string; tag?: CallTag }) {
  if (!text) return null;

  return (
    <p
      data-role="cheer"
      className="text-sm"
      style={tag ? { color: TAG_BORDER_COLOR[tag] } : undefined}
    >
      {renderTextParts(text, "cheer")}
    </p>
  );
}

function OriginalText({ text, tag }: { text: string; tag?: CallTag }) {
  if (!text && !tag) return null;

  return (
    <p data-role="original">
      {tag ? <CallIcon name={tag} /> : null}
      {text}
    </p>
  );
}

function PronunciationText({ text }: { text: LyricText }) {
  if (!text) return null;

  return (
    <p data-role="pronunciation">
      <LyricTextRenderer text={text} prefix="pron" />
    </p>
  );
}

function TranslationText({ text }: { text: string }) {
  if (!text) return null;

  return <p data-role="translation">{text}</p>;
}

export function LyricLine({
  line,
  isActive,
  lineClick,
}: {
  line: LyricLineData;
  isActive: boolean;
  lineClick?: () => void; // 줄을 클릭했을 때 영상을 `line.time` 지점으로 이동
}) {
  const cheerText =
    typeof line.cheer === "string" ? line.cheer : line.cheer?.text;
  const lineTag = typeof line.cheer === "string" ? undefined : line.cheer?.tag;
  const lineStyle = lineTag
    ? ({
        "--tag-border": isActive ? TAG_BORDER_COLOR[lineTag] : "transparent",
        "--tag-bg": TAG_BACKGROUND_COLOR[lineTag],
      } as React.CSSProperties)
    : undefined;

  const content = (
    <>
      <CheerText text={cheerText} tag={lineTag} />
      <OriginalText text={line.original} tag={lineTag} />
      <PronunciationText text={line.pronunciation} />
      <TranslationText text={line.translation} />
    </>
  );

  return (
    <li
      data-active={isActive || undefined}
      data-time={line.time}
      data-call-tag={lineTag}
      className={clsx(
        "group px-3 transition-colors hover:bg-white/20",
        lineClick && "cursor-pointer",
        line.interlude ? "py-6 text-center" : "py-3 text-left",
        lineTag && "border border-(--tag-border) bg-(--tag-bg)", // 인라인 style로 backgroundColor를 직접 주면 hover:bg-* 클래스를 항상 덮어써버리므로, CSS 변수 + 임의값 클래스로 우회해 hover가 이길 수 있게 함
        isActive && "font-semibold",
        isActive && !lineTag && "bg-black/60",
      )}
      style={lineStyle}
    >
      {lineClick ? (
        <button
          type="button"
          onClick={lineClick}
          className={clsx(
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
