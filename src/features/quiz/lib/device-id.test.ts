import { describe, it, expect, beforeEach } from "vitest";
import { getDeviceId } from "./device-id";

function clearDeviceCookie() {
  document.cookie = "ztmy_quiz_device_id=; path=/; max-age=0";
}

describe("getDeviceId", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearDeviceCookie();
  });

  it("generates a new UUID when nothing is stored", () => {
    const id = getDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns the same id on repeated calls (persisted via localStorage)", () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
  });

  it("falls back to the cookie value when localStorage is empty, and backfills it", () => {
    const id = getDeviceId();
    window.localStorage.clear();

    const recovered = getDeviceId();
    expect(recovered).toBe(id);
    expect(window.localStorage.getItem("ztmy_quiz_device_id")).toBe(id);
  });
});
