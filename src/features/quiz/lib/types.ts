export type QuestionType = "mc" | "ox";

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
