import { type Img, type SectionId } from "@/features/info/lib/types";
import { INFO_SECTIONS } from "@/features/info/info";

export function groupImagesBySection(
  images: Img[] = [],
): Record<SectionId, Img[]> {
  const grouped = INFO_SECTIONS.reduce(
    (acc, section) => {
      acc[section.id] = [];
      return acc;
    },
    {} as Record<SectionId, Img[]>,
  );

  for (const img of images) {
    grouped[img.section].push(img);
  }

  return grouped;
}
