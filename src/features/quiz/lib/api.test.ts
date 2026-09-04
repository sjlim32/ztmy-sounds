import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  supabase: { rpc: vi.fn() },
}));

import { supabase } from "@/lib/supabase/client";
import {
  getRandomPracticeQuestion,
  revealPracticeAnswer,
  startQuizAttempt,
  submitQuizAttempt,
} from "./api";

describe("quiz api", () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
  });

  it("getRandomPracticeQuestion calls the RPC and returns data", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { id: "q1", type: "ox", question_text: "?", choices: null },
      error: null,
    } as never);

    const result = await getRandomPracticeQuestion();

    expect(supabase.rpc).toHaveBeenCalledWith("get_random_practice_question");
    expect(result.id).toBe("q1");
  });

  it("revealPracticeAnswer passes the question id", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { correct_answer: "O", explanation: "설명" },
      error: null,
    } as never);

    await revealPracticeAnswer("q1");

    expect(supabase.rpc).toHaveBeenCalledWith("reveal_practice_answer", {
      p_question_id: "q1",
    });
  });

  it("startQuizAttempt passes device id and fingerprint", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { already_submitted: false, attempt_id: "a1", questions: [] },
      error: null,
    } as never);

    await startQuizAttempt("device-1", "fp-1");

    expect(supabase.rpc).toHaveBeenCalledWith("start_quiz_attempt", {
      p_device_uuid: "device-1",
      p_fingerprint_hash: "fp-1",
    });
  });

  it("submitQuizAttempt passes attempt id, device id and answers", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { score: 1, total: 2 },
      error: null,
    } as never);

    await submitQuizAttempt("a1", "device-1", { q1: "O" });

    expect(supabase.rpc).toHaveBeenCalledWith("submit_quiz_attempt", {
      p_attempt_id: "a1",
      p_device_uuid: "device-1",
      p_answers: { q1: "O" },
    });
  });

  it("throws when Supabase returns an error", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error("boom"),
    } as never);

    await expect(getRandomPracticeQuestion()).rejects.toThrow("boom");
  });
});
