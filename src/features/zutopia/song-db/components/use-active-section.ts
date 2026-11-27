import { useEffect, useState } from "react";

/**
 * 스크롤 컨테이너(rootId) 안에서 지금 화면 위쪽에 걸친 구역의 id — 곡 목록 PC 목차가
 * "지금 보는 앨범"을 강조하는 데 쓴다. 화면 위 25% 띠에 걸친 구역 중 목록 순서상 첫
 * 번째를 고른다(앞 구역 끝과 다음 구역 시작이 같이 걸치면 앞 구역). 구역 목록이 바뀌면
 * (정렬·필터) 다시 관찰한다. 처음엔 첫 구역.
 */
export function useActiveSection(ids: string[], rootId: string) {
  const key = ids.join("\n");
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const list = key ? key.split("\n") : [];
    const root = document.getElementById(rootId);
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = list.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { root, rootMargin: "0px 0px -75% 0px" },
    );
    for (const id of list) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [key, rootId]);

  return active;
}
