/**
 * Normalize question text for similarity comparison:
 * lowercase, trim, remove extra spaces, keep only alphanumeric and spaces
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Get set of significant words (length > 2 to skip "the", "and", etc.)
 */
function getWordSet(text: string): Set<string> {
  const normalized = normalizeForComparison(text);
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Jaccard similarity: intersection size / union size
 * Returns a value between 0 (no overlap) and 1 (identical)
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Compute max similarity of content to any of the existing contents (0-1)
 */
function maxSimilarityToExisting(content: string, existingContents: string[]): number {
  if (existingContents.length === 0) return 0;
  const setA = getWordSet(content);
  let max = 0;
  for (const existing of existingContents) {
    const sim = jaccardSimilarity(setA, getWordSet(existing));
    if (sim > max) max = sim;
  }
  return max;
}

/**
 * Check if two question contents are similar (above threshold)
 */
export function areQuestionsSimilar(
  contentA: string,
  contentB: string,
  threshold: number = 0.45
): boolean {
  const setA = getWordSet(contentA);
  const setB = getWordSet(contentB);
  return jaccardSimilarity(setA, setB) >= threshold;
}

/**
 * From newQuestions, keep the `count` questions that have the LOWEST max similarity
 * to existingContents (i.e. most unique). Drops the ones most similar to recent questions.
 */
export function selectLeastSimilarQuestions<T extends { content: string }>(
  newQuestions: T[],
  existingContents: string[],
  count: number
): T[] {
  if (newQuestions.length <= count) return newQuestions;

  const withScore = newQuestions.map((q) => ({
    question: q,
    maxSimilarity: maxSimilarityToExisting(q.content, existingContents),
  }));

  // Sort by maxSimilarity ascending (lowest first = most unique)
  withScore.sort((a, b) => a.maxSimilarity - b.maxSimilarity);

  return withScore.slice(0, count).map((x) => x.question);
}

/**
 * Filter a list of questions to only those that are not similar to any in existingContents
 */
export function filterDuplicateQuestions<T extends { content: string }>(
  newQuestions: T[],
  existingContents: string[],
  threshold: number = 0.45
): T[] {
  return newQuestions.filter((q) => {
    const isDuplicate = existingContents.some((existing) =>
      areQuestionsSimilar(q.content, existing, threshold)
    );
    return !isDuplicate;
  });
}
