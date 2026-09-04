import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fingerprintjs/fingerprintjs", () => ({
  default: { load: vi.fn() },
}));

describe("getFingerprint", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the visitorId from the loaded agent", async () => {
    const FingerprintJS = (await import("@fingerprintjs/fingerprintjs"))
      .default;
    vi.mocked(FingerprintJS.load).mockResolvedValue({
      get: () => Promise.resolve({ visitorId: "abc123" }),
    } as never);

    const { getFingerprint } = await import("./fingerprint");
    await expect(getFingerprint()).resolves.toBe("abc123");
  });

  it("caches the agent load across repeated calls", async () => {
    const FingerprintJS = (await import("@fingerprintjs/fingerprintjs"))
      .default;
    const getMock = vi.fn().mockResolvedValue({ visitorId: "abc123" });
    vi.mocked(FingerprintJS.load).mockResolvedValue({ get: getMock } as never);

    const { getFingerprint } = await import("./fingerprint");
    await getFingerprint();
    await getFingerprint();

    expect(FingerprintJS.load).toHaveBeenCalledTimes(1);
  });
});
