import { describe, expect, test } from "vitest";
import { serializeJsonLd } from "@/lib/structured-data";

describe("serializeJsonLd", () => {
  test('"</script>"가 태그를 닫지 않게 <를 이스케이프', () => {
    expect(serializeJsonLd({ name: "</script>" })).toBe(
      '{"name":"\\u003c/script>"}',
    );
  });
});
