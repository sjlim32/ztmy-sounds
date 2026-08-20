import type { CallIconName } from "@/lib/guide/types";

const ICON_LABEL: Record<CallIconName, string> = {
  wave: "손 흔들기",
  clap: "박수",
  mic: "떼창",
};

/** Placeholder inline marker for a call gesture; swap for real icon assets later. */
export function CallIcon({ name }: { name: CallIconName }) {
  return (
    <span data-call-icon={name} title={ICON_LABEL[name]}>
      [{name}]
    </span>
  );
}
