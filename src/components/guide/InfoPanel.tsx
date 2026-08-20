"use client";

import { useState } from "react";
import InfoContent from "@/content/info.mdx";

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section data-role="info-panel" className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded border border-white/30 px-4 py-2 font-medium"
      >
        공연 정보
      </button>
      {isOpen ? (
        <div
          data-role="info-content"
          className="absolute right-0 top-full z-10 mt-2 w-72 rounded border border-white/30 bg-background p-4"
        >
          <InfoContent />
        </div>
      ) : null}
    </section>
  );
}
