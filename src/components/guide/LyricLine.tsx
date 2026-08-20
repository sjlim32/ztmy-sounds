import { Fragment } from "react";
import type { LyricLine as LyricLineData, LyricText } from "@/lib/guide/types";
import { parseIconTokens } from "@/lib/guide/icon-tokens";
import { CallIcon } from "@/components/guide/CallIcon";

function renderTextParts(text: string, key: string) {
  return parseIconTokens(text).map((part, index) =>
    part.type === "icon" ? (
      <CallIcon key={`${key}-${index}`} name={part.value} />
    ) : (
      <Fragment key={`${key}-${index}`}>{part.value}</Fragment>
    )
  );
}

function LyricTextRenderer({ text, prefix }: { text: LyricText; prefix: string }) {
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

export function LyricLine({
  line,
  isActive,
  onSelect,
}: {
  line: LyricLineData;
  isActive: boolean;
  /** 줄을 클릭했을 때 호출됩니다 (예: 영상을 `line.time` 지점으로 이동). */
  onSelect?: () => void;
}) {
  const content = (
    <>
      {line.original ? <p data-role="original">{line.original}</p> : null}
      {line.pronunciation ? (
        <p data-role="pronunciation">
          <LyricTextRenderer text={line.pronunciation} prefix="pron" />
        </p>
      ) : null}
      {line.translation ? <p data-role="translation">{line.translation}</p> : null}
      {line.background ? (
        <p data-role="background">
          <LyricTextRenderer text={line.background} prefix="bg" />
        </p>
      ) : null}
    </>
  );

  return (
    <li data-active={isActive || undefined} data-time={line.time}>
      {onSelect ? (
        <button type="button" onClick={onSelect}>
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}
