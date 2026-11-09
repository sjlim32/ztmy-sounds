"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  SOFT_PRIMARY_BUTTON_CLASS,
  SOFT_BUTTON_CLASS,
} from "@/components/button-styles";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { CopyIcon } from "@/components/icons/CopyIcon";
import type { AttendanceSummary } from "@/features/zutopia/attendance/summarize";
import {
  NICKNAME_MAX_LENGTH,
  useNickname,
} from "@/features/zutopia/attendance/useNickname";
import { pickShareLayout, SHARE_PIXEL_RATIO, SHARE_SIZE } from "./layout";
import { buildFontEmbedCss } from "./font-embed";
import { saveActions } from "./save-actions";
import { ShareImage } from "./ShareImage";

const FILE_NAME = "ztmy-live-attendance.png";
const SHARE_TEXT =
  "나의 ZUTOMAYO 라이브 참전 기록 #ずとまよ #즛토마요\nhttps://ztmy-sounds.fans/zutopia/attendance";

/** 화면 밖 이미지 안의 그림(로고·커버)이 다 받아질 때까지 기다린다(최대 4초). */
async function waitForImages(node: HTMLElement, timeoutMs = 4000) {
  const waitAll = Promise.all(
    [...node.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : img.decode().catch(() => undefined),
    ),
  );
  await Promise.race([
    waitAll,
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

interface Result {
  blob: Blob;
  url: string;
}

/**
 * 이미지 만들기 모달의 내용 — 닉네임 입력 → 만들기 → 같은 모달 안에서 완성
 * 이미지 미리보기 + 저장·공유·다시 만들기. 만드는 동안만 1080 배치의 이미지를
 * 화면 밖에 그려 2160×2160 PNG로 만든다.
 */
export function ImageMaker({ summary }: { summary: AttendanceSummary }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [nickname, setNickname] = useNickname();
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rendering = createdAt !== null;
  const layout = pickShareLayout(summary.heard.length);
  // 만드는 도중 창이 닫히면 결과를 버린다(만든 그림 메모리가 새지 않게).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 결과를 버리거나 모달을 닫으면 만든 그림의 메모리를 돌려준다.
  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  const make = async () => {
    setError(null);
    setCreatedAt(new Date());
    // 화면 밖 이미지가 그려지고 레이아웃/스타일 계산이 완료될 때까지 두 프레임 기다린다.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    try {
      const node = nodeRef.current;
      if (!node) throw new Error("image node missing");
      await document.fonts.ready;
      await waitForImages(node);
      // 라이브러리는 누를 때 불러온다(페이지 첫 로딩에 싣지 않게).
      const [{ toBlob }, fontEmbedCSS] = await Promise.all([
        import("html-to-image"),
        buildFontEmbedCss(node),
      ]);
      const blob = await toBlob(node, {
        width: SHARE_SIZE,
        height: SHARE_SIZE,
        pixelRatio: SHARE_PIXEL_RATIO,
        // 필요한 글꼴 서브셋만(안 넘기면 글꼴 파일 수백 개, 약 10MB를 받는다).
        fontEmbedCSS,
      });
      if (!blob) throw new Error("empty image");
      if (!mountedRef.current) return;
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch {
      if (mountedRef.current)
        setError("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      if (mountedRef.current) setCreatedAt(null);
    }
  };

  if (result) {
    return <ResultView result={result} onRemake={() => setResult(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/70">닉네임</span>
        <input
          type="text"
          value={nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="나의"
          className="focus-visible:outline-ztmy-magenta h-11 rounded-md border border-white/15 bg-black/30 px-3 text-base text-white placeholder:text-white/35 focus-visible:outline-2"
        />
      </label>
      <p className="text-sm text-white/60">
        제목: {nickname.trim() ? `${nickname.trim()}의` : "나의"} ZUTOMAYO
        라이브 참전 기록
      </p>
      <button
        type="button"
        onClick={make}
        disabled={rendering || summary.heard.length === 0}
        className={cn(
          SOFT_PRIMARY_BUTTON_CLASS,
          "w-full px-4 py-3 text-base disabled:opacity-50",
        )}
      >
        {rendering ? "이미지 만드는 중…" : "이미지 만들기"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-white/70">
          {error}
        </p>
      )}

      {createdAt &&
        createPortal(
          // 화면 밖에 그린다 — 캡처는 안쪽 이미지 요소만 하므로 위치 값은
          // 결과에 영향이 없다.
          <div aria-hidden style={{ position: "fixed", left: -100000, top: 0 }}>
            <ShareImage
              ref={nodeRef}
              summary={summary}
              layout={layout}
              nickname={nickname}
              createdAt={createdAt}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

/** 이미지 생성 완료 — 미리보기 + 저장·공유·다시 만들기. */
function ResultView({
  result,
  onRemake,
}: {
  result: Result;
  onRemake: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const file = new File([result.blob], FILE_NAME, { type: "image/png" });
  const canShare =
    typeof navigator !== "undefined" &&
    !!navigator.canShare?.({ files: [file] });
  const canCopy =
    typeof navigator !== "undefined" &&
    typeof ClipboardItem !== "undefined" &&
    !!navigator.clipboard?.write;
  // 터치가 주 입력인 기기(휴대폰·태블릿) — 결과 화면은 브라우저에서만 그려진다.
  const touch =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  const actions = saveActions({ canShare, touch, canCopy });

  const download = () => {
    const link = document.createElement("a");
    link.href = result.url;
    link.download = FILE_NAME;
    link.click();
  };

  const share = async () => {
    try {
      await navigator.share({ files: [file], text: SHARE_TEXT });
    } catch {
      // 공유 시트를 닫았거나 막힌 경우 — 그대로 둔다(저장 버튼이 있다).
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [result.blob.type]: result.blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사 권한 제한 등으로 실패 시 다운로드로 유도할 수 있도록 동작 유지
    }
  };

  const handleAction = (kind: (typeof actions)[number]["kind"]) => {
    if (kind === "share") return share();
    if (kind === "copy") return copy();
    return download();
  };

  const renderIcon = (kind: (typeof actions)[number]["kind"]) => {
    if (kind === "share") return <ShareIcon className="size-4" />;
    if (kind === "copy") return <CopyIcon className="size-4" />;
    return <DownloadIcon className="size-4" />;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.url}
        alt="참전 기록 이미지"
        className="aspect-square w-full rounded-md object-contain"
      />
      {touch && (
        <p className="text-sm text-white/60">
          {canShare
            ? "사진 앱에 넣으려면 공유 → “이미지 저장”을 누르거나, 이미지를 길게 눌러 저장하세요."
            : "인앱 브라우저나 일부 환경에서는 저장이 제한될 수 있어요. 이미지를 길게 눌러 사진에 저장하세요."}
        </p>
      )}
      {/* 휴대폰은 "공유"(공유 시트 → 사진에 저장)가 주 버튼, PC는 "저장"(내려받기) 또는 "복사" — saveActions. */}
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.kind}
            type="button"
            onClick={() => handleAction(action.kind)}
            className={
              action.primary
                ? cn(
                    SOFT_PRIMARY_BUTTON_CLASS,
                    "px-4 py-2.5 text-sm",
                    actions.length === 1 && "col-span-2",
                  )
                : cn(SOFT_BUTTON_CLASS, "justify-center")
            }
          >
            {renderIcon(action.kind)}
            {action.kind === "copy" && copied ? "복사됨!" : action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onRemake}
          className={cn(SOFT_BUTTON_CLASS, "col-span-2 justify-center")}
        >
          닉네임 바꿔서 다시 만들기
        </button>
      </div>
    </div>
  );
}
