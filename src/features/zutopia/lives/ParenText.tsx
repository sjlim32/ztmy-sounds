import { Fragment } from "react";

/**
 * region/live_venue는 "東京 (도쿄)"처럼 원어 뒤 괄호에 번역·부연설명이
 * 붙는다 — 괄호 부분만 한 단계 작고 흐리게 그려 본문이 먼저 읽히게 한다.
 * 크기는 em 단위라 어느 글자 크기 안에 넣어도 비율이 유지된다.
 */
export function ParenText({ text }: { text: string }) {
  return text.split(/(\([^()]*\))/).map((part, i) =>
    part.startsWith("(") && part.endsWith(")") ? (
      <span key={i} className="text-[0.8em] font-normal opacity-60">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
