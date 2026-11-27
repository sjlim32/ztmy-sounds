import { describe, expect, test } from "vitest";
import { groupLinks } from "./group-links";

const url = (name: string, disabled?: boolean) => ({
  name,
  href: `https://example.com/${encodeURIComponent(name)}`,
  ...(disabled ? { disabled } : {}),
});

describe("groupLinks", () => {
  test("이름 끝 괄호 앞이 같은 연달은 링크를 한 묶음으로 — 묶음 이름은 한 번, 링크는 괄호 안 글자로", () => {
    expect(
      groupLinks([
        url("1차 선행 (국내)"),
        url("1차 선행 (해외)"),
        url("2차 선행 (국내)", true),
      ]),
    ).toEqual([
      {
        title: "1차 선행",
        links: [
          { label: "국내", href: url("1차 선행 (국내)").href },
          { label: "해외", href: url("1차 선행 (해외)").href },
        ],
      },
      {
        title: "2차 선행",
        links: [
          {
            label: "국내",
            href: url("2차 선행 (국내)").href,
            disabled: true,
          },
        ],
      },
    ]);
  });

  test("괄호가 없는 링크는 묶음 이름 없이 이름 그대로 하나씩", () => {
    expect(groupLinks([url("공식 홈페이지"), url("공식 X")])).toEqual([
      {
        title: null,
        links: [{ label: "공식 홈페이지", href: url("공식 홈페이지").href }],
      },
      { title: null, links: [{ label: "공식 X", href: url("공식 X").href }] },
    ]);
  });
});
