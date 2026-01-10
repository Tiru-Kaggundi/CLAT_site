/**
 * News fetcher module
 * 
 * This module is integrated into the Gemini client via Google Search grounding.
 * The Gemini API with search grounding automatically fetches recent news when
 * the prompt requests information from the last 72 hours.
 * 
 * No separate implementation needed - the grounding happens automatically
 * when using the Gemini API with googleSearchRetrieval tool enabled.
 */

export const NEWS_CATEGORIES = [
  "current_affairs",
  "international_relations",
  "legal_developments",
  "government_schemes",
  "science_tech",
  "sports",
  "awards",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];
