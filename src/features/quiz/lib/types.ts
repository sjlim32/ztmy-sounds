export type QuestionType = "mc" | "ox";

export type Difficulty = "easy" | "medium" | "hard" | "extreme";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "즛 뉴비",
  medium: "즛 청년",
  hard: "즛 고인물",
  extreme: "즛 할배",
};

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  question_text: string;
  choices: string[] | null;
}

export interface RevealAnswerResult {
  correct_answer: string;
  explanation: string | null;
}

export interface StartAttemptResult {
  already_submitted: boolean;
  attempt_id: string;
  score?: number;
  total?: number;
  questions?: PracticeQuestion[];
}

export interface SubmitAttemptResult {
  score: number;
  total: number;
}
