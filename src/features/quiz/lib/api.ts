import { supabase } from "@/lib/supabase/client";
import type {
  PracticeQuestion,
  RevealAnswerResult,
  StartAttemptResult,
  SubmitAttemptResult,
} from "./types";

export async function getRandomPracticeQuestion(): Promise<PracticeQuestion | null> {
  const { data, error } = await supabase.rpc("get_random_practice_question");
  if (error) throw error;
  return (data as PracticeQuestion | null) ?? null;
}

export async function revealPracticeAnswer(
  questionId: string,
): Promise<RevealAnswerResult> {
  const { data, error } = await supabase.rpc("reveal_practice_answer", {
    p_question_id: questionId,
  });
  if (error) throw error;
  return data as RevealAnswerResult;
}

export async function startQuizAttempt(
  deviceUuid: string,
  fingerprintHash: string | null,
): Promise<StartAttemptResult> {
  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_device_uuid: deviceUuid,
    p_fingerprint_hash: fingerprintHash,
  });
  if (error) throw error;
  return data as StartAttemptResult;
}

export async function submitQuizAttempt(
  attemptId: string,
  deviceUuid: string,
  answers: Record<string, string>,
): Promise<SubmitAttemptResult> {
  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: attemptId,
    p_device_uuid: deviceUuid,
    p_answers: answers,
  });
  if (error) throw error;
  return data as SubmitAttemptResult;
}
