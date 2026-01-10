export type QuestionOption = "a" | "b" | "c" | "d";

export interface QuestionOptions {
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface Question {
  id: string;
  set_id: string;
  content: string;
  options: QuestionOptions;
  correct_option: QuestionOption;
  explanation: string;
  category: string;
  created_at: Date;
}

export interface QuestionSet {
  id: string;
  date: string; // YYYY-MM-DD
  created_at: Date;
}

export interface UserResponse {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: QuestionOption;
  is_correct: boolean;
  answered_at: Date;
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
  streak_count: number;
  last_active_date: string | null;
  total_score: number;
  last_completed_at: Date | null;
}

export interface QuestionWithResponse extends Question {
  userResponse?: {
    selected_option: QuestionOption;
    is_correct: boolean;
  };
}
