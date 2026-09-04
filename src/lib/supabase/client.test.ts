import { describe, it, expect, beforeEach, vi } from "vitest";

describe("supabase client", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY = "anon-key";

    await expect(import("./client")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("creates a client when both env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY = "anon-key";

    const { supabase } = await import("./client");
    expect(supabase).toBeDefined();
  });
});
