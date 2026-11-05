import type { LiveUnit } from "@/features/zutopia/live-history/types";

/**
 * 참전 기록 공유 코드 — "ZT1" + base64url. 체크한 공연(lives 행)마다 5바이트:
 * lives.id 앞 4바이트(16진수 8자리) + 그 공연의 몇째 날을 체크했는지 비트(최대
 * 8일, 0번 비트 = 첫날). 공연 목록의 순번이 아니라 공연 ID로 가리켜서, 나중에
 * 지난 공연이 추가되거나 순서가 바뀌어도 이미 퍼진 코드가 깨지지 않는다.
 * 지금 데이터에 없는 공연은 읽을 때 버린다.
 */
const PREFIX = "ZT1";
const BYTES_PER_LIVE = 5;

function liveKey(liveId: string): string {
  return liveId.replaceAll("-", "").slice(0, 8).toLowerCase();
}

/** 공연(liveId)마다 날짜순 단위 목록 — 비트 위치 = 이 목록의 순번 */
function unitsByLive(units: LiveUnit[]): Map<string, LiveUnit[]> {
  const map = new Map<string, LiveUnit[]>();
  for (const unit of units) {
    const list = map.get(unit.liveId) ?? [];
    list.push(unit);
    map.set(unit.liveId, list);
  }
  for (const list of map.values())
    list.sort((a, b) => a.date.localeCompare(b.date));
  return map;
}

function toBase64Url(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): number[] | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return [...binary].map((char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export function encodeAttendance(
  units: LiveUnit[],
  attended: ReadonlySet<string>,
): string {
  const bytes: number[] = [];
  for (const [liveId, list] of unitsByLive(units)) {
    let mask = 0;
    list.slice(0, 8).forEach((unit, index) => {
      if (attended.has(unit.id)) mask |= 1 << index;
    });
    if (!mask) continue;
    const key = liveKey(liveId);
    for (let i = 0; i < 8; i += 2)
      bytes.push(parseInt(key.slice(i, i + 2), 16));
    bytes.push(mask);
  }
  return PREFIX + toBase64Url(bytes);
}

/** 코드 → 지금 데이터의 공연 단위 ID 목록. 형식이 아니면 null. */
export function decodeAttendance(
  code: string,
  units: LiveUnit[],
): string[] | null {
  if (!code.startsWith(PREFIX)) return null;
  const bytes = fromBase64Url(code.slice(PREFIX.length));
  if (!bytes || bytes.length % BYTES_PER_LIVE !== 0) return null;

  const byKey = new Map<string, LiveUnit[]>();
  for (const [liveId, list] of unitsByLive(units))
    byKey.set(liveKey(liveId), list);

  const ids: string[] = [];
  for (let i = 0; i < bytes.length; i += BYTES_PER_LIVE) {
    const key = bytes
      .slice(i, i + 4)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const mask = bytes[i + 4];
    const list = byKey.get(key);
    if (!list) continue;
    list.forEach((unit, index) => {
      if (index < 8 && mask & (1 << index)) ids.push(unit.id);
    });
  }
  return ids;
}

/** 붙여넣은 글자(코드 그대로, 또는 #code= / ?code= 가 붙은 링크)에서 코드만 꺼낸다. */
export function extractCode(input: string): string | null {
  const text = input.trim();
  const fromLink = /[#?&]code=([A-Za-z0-9_-]+)/.exec(text);
  if (fromLink) return fromLink[1];
  return /^ZT1[A-Za-z0-9_-]*$/.test(text) ? text : null;
}
