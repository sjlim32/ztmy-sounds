import type { ComponentType } from "react";

export interface Notice {
  id: string;
  title: string;
  version: number;
  content: ComponentType;
  isAlwaysOpen?: boolean;
}
