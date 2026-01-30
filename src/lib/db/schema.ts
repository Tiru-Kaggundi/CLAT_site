import { pgTable, uuid, text, timestamp, integer, date, jsonb, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  streak_count: integer("streak_count").default(0).notNull(),
  last_active_date: date("last_active_date"),
  total_score: integer("total_score").default(0).notNull(),
  last_completed_at: timestamp("last_completed_at"),
});

export const questionSets = pgTable("question_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  set_id: uuid("set_id")
    .notNull()
    .references(() => questionSets.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  options: jsonb("options").notNull().$type<{ a: string; b: string; c: string; d: string }>(),
  correct_option: text("correct_option").notNull(), // 'a', 'b', 'c', or 'd'
  explanation: text("explanation").notNull(),
  category: text("category").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const userResponses = pgTable(
  "user_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    question_id: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    selected_option: text("selected_option").notNull(), // 'a', 'b', 'c', or 'd'
    is_correct: boolean("is_correct").notNull(),
    answered_at: timestamp("answered_at").defaultNow().notNull(),
  },
  (table) => ({
    userQuestionUnique: unique().on(table.user_id, table.question_id),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  responses: many(userResponses),
}));

export const questionSetsRelations = relations(questionSets, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  set: one(questionSets, {
    fields: [questions.set_id],
    references: [questionSets.id],
  }),
  responses: many(userResponses),
}));

export const userResponsesRelations = relations(userResponses, ({ one }) => ({
  user: one(users, {
    fields: [userResponses.user_id],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [userResponses.question_id],
    references: [questions.id],
  }),
}));

/** Anonymous attempts: one row per attempt, labeled anon_user_1, anon_user_2, ... */
export const anonymousAttempts = pgTable("anonymous_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  anon_user_label: text("anon_user_label").notNull(), // e.g. "anon_user_1"
  set_date: date("set_date").notNull(),
  score: integer("score").notNull(),
  total_questions: integer("total_questions").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
