import type { ComponentType } from "react";

export interface Notice {
  id: string;
  type: "notice" | "guide";
  title: string;
  version: number;
  content: ComponentType;
  visible: boolean;
  isAlwaysOpen?: boolean;
  isSlamVisible?: boolean;
}
