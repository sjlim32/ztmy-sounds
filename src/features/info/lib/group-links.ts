import { splitParenSuffix } from "@/lib/split-paren-suffix";

export type LinkGroup = {
  /** 묶음 이름("1차 선행") — 괄호 없는 링크는 null(묶음 이름 없이 링크 하나) */
  title: string | null;
  links: { label: string; href: string; disabled?: boolean }[];
};

/**
 * 공연 정보 상세 정보의 링크를 묶는다 — "1차 선행 (국내)" · "1차 선행 (해외)"처럼 이름 끝
 * 괄호 앞이 같은 연달은 링크는 한 묶음("1차 선행" + 국내 · 해외)으로 해서 같은 글자를
 * 되풀이하지 않는다. 괄호가 없는 링크는 이름 그대로 하나씩.
 */
export function groupLinks(
  items: readonly { name: string; href: string; disabled?: boolean }[],
): LinkGroup[] {
  const groups: LinkGroup[] = [];
  for (const item of items) {
    const { main, suffix } = splitParenSuffix(item.name);
    const link = {
      label: suffix ?? item.name,
      href: item.href,
      ...(item.disabled ? { disabled: true } : {}),
    };
    const last = groups.at(-1);
    if (suffix && last?.title === main) last.links.push(link);
    else groups.push({ title: suffix ? main : null, links: [link] });
  }
  return groups;
}
