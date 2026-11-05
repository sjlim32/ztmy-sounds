"use client";

import { useRef, useState } from "react";
import { LINK_BUTTON_CLASS } from "@/components/button-styles";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import {
  backupFileName,
  parseBackup,
  serializeAttendance,
} from "@/features/zutopia/attendance/storage";

/**
 * 체크 내역 백업(JSON 파일 내려받기)·복원(파일 불러와 덮어쓰기). 체크 내역이
 * 브라우저에만 있어서, 기기를 바꾸거나 저장소를 지우기 전에 옮겨 둘 수 있게 한다.
 */
export function BackupControls({
  attended,
  onRestore,
}: {
  attended: ReadonlySet<string>;
  onRestore: (ids: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const backup = () => {
    const now = new Date();
    const blob = new Blob([serializeAttendance(attended, now)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(now);
    link.click();
    URL.revokeObjectURL(url);
    setMessage(null);
  };

  const restore = async (file: File) => {
    const data = parseBackup(await file.text());
    if (!data) {
      setMessage("백업 파일 형식이 아니에요.");
      return;
    }
    if (
      !window.confirm(
        `지금 체크 내역을 백업 파일 내용(공연 ${data.attended.length}개)으로 바꿀까요?`,
      )
    )
      return;
    onRestore(data.attended);
    setMessage("백업 파일로 복원했어요.");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={backup} className={LINK_BUTTON_CLASS}>
          <DownloadIcon className="size-4" />
          체크 내역 백업
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={LINK_BUTTON_CLASS}
        >
          백업 파일로 복원
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void restore(file);
          }}
        />
      </div>
      {message && (
        <p role="status" className="text-sm text-white/60">
          {message}
        </p>
      )}
    </div>
  );
}
