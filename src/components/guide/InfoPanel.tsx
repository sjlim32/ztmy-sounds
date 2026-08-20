"use client";

import { useState } from "react";
import InfoContent from "@/content/info.mdx";

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section data-role="info-panel">
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        공연 정보
      </button>
      {isOpen ? (
        <div data-role="info-content">
          <InfoContent />
        </div>
      ) : null}
    </section>
  );
}
