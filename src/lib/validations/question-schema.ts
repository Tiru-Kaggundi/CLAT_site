import { z } from "zod";

export const questionOptionSchema = z.enum(["a", "b", "c", "d"]);

export const questionOptionsSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  c: z.string().min(1),
  d: z.string().min(1),
});

export const questionSchema = z.object({
  content: z.string().min(10),
  options: questionOptionsSchema,
  correct_option: questionOptionSchema,
  explanation: z.string().min(10),
  category: z.string().min(1),
});

export const questionSetSchema = z.array(questionSchema).length(10);

export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionSetInput = z.infer<typeof questionSetSchema>;
