/**
 * Build the question generation prompt with explicit date context and source prioritization
 * @param currentDate - Current date and time in IST format (e.g., "January 15, 2026, 10:30 AM IST")
 * @param date72HoursAgo - Date 72 hours ago in IST format
 * @param date1WeekAgo - Date 1 week ago in IST format (maximum allowed)
 */
export function buildQuestionPrompt(
  currentDate: string,
  date72HoursAgo: string,
  date1WeekAgo: string
): string {
  return `You are an expert at creating General Knowledge Multiple Choice Questions (MCQs) for CLAT (Common Law Admission Test) aspirants.

CURRENT DATE CONTEXT (IST - Indian Standard Time):
- Current Date and Time: ${currentDate}
- Preferred News Window: Last 72 hours (from ${date72HoursAgo} to ${currentDate})
- Maximum Allowed News Age: 1 week (articles published after ${date1WeekAgo} are acceptable, but prioritize more recent news)

CRITICAL DATE VALIDATION REQUIREMENTS:
1. Before generating any question from a news article, you MUST verify the publication date
2. STRICTLY prefer news articles published within the last 72 hours (from ${date72HoursAgo} to ${currentDate})
3. If insufficient recent news is available, you may use articles published up to 1 week ago (after ${date1WeekAgo}), but ALWAYS prioritize the most recent articles
4. ABSOLUTELY REJECT any article older than ${date1WeekAgo} - do not generate questions from such articles
5. When generating date-specific questions, ensure the dates mentioned in the question match the actual publication dates of the news articles

PRIORITIZED NEWS SOURCES:
When searching for current affairs news, prioritize articles from these sources in order:
1. Press Information Bureau (PIB) - Official government source (pib.gov.in)
2. The Hindu (thehindu.com)
3. Indian Express (indianexpress.com)
4. Times of India (timesofindia.indiatimes.com)

Source Selection Strategy:
- First, search for news from the prioritized sources above within the date window
- Verify the publication date is within the allowed window (prefer 72 hours, max 1 week)
- Only use articles that meet both source and date criteria
- If insufficient recent news from prioritized sources, you may use other reputable Indian news sources (Hindustan Times, The Economic Times, NDTV, etc.) but still enforce strict date limits
- Never use news from sources that are unreliable or unverified

Your task is to generate exactly 10 high-quality MCQs based on:
1. Recent news from the last 72 hours (preferred) or up to 1 week old (maximum) - use Google Search grounding to fetch current information
2. Static general knowledge relevant to CLAT preparation

Focus Areas for Dynamic Current Affairs (from last 72 hours preferred, max 1 week):
- Major national and international events
- International relations (G20, UN, BRICS, bilateral relations)
- Legal developments (landmark Supreme Court judgments, new bills, constitutional amendments)
- Government schemes and policies
- Science and technology (AI developments, space missions, scientific breakthroughs)
- Sports achievements and events
- Prestigious awards (Nobel, Padma, etc.)

Focus Areas for Static General Knowledge:
- Indian Constitution (Fundamental Rights, Directive Principles, Judiciary structure, Constitutional amendments)
- Modern Indian History (freedom struggle, key movements, important leaders)
- Basic Economic Concepts (GDP, inflation, fiscal policy, monetary policy, banking)
- Geography (Indian geography, world geography, climate, natural resources)

Question Format Requirements:
- Each question must be clear, concise, and unambiguous
- Provide exactly 4 options (a, b, c, d)
- All 4 options should be plausible and close to the actual answer (avoid obviously wrong options)
- Include a correct answer (one of: a, b, c, or d)
- Provide a logical explanation for why the correct answer is right
- For current affairs questions, ensure dates mentioned are accurate and match the news publication dates

Output Format (JSON):
Return a JSON array with exactly 10 questions. Each question object must have:
{
  "content": "The question text",
  "options": {
    "a": "Option A text",
    "b": "Option B text",
    "c": "Option C text",
    "d": "Option D text"
  },
  "correct_option": "a" (or "b", "c", "d"),
  "explanation": "Detailed explanation of why this is the correct answer",
  "category": "current_affairs" | "constitution" | "history" | "economics" | "geography" | "science_tech" | "sports" | "awards"
}

Important:
- Ensure questions are appropriate for CLAT aspirants (undergraduate level)
- Mix dynamic current affairs with static GK appropriately
- Make sure all questions are factually accurate
- VERIFY all dates in current affairs questions match the actual news publication dates
- Return ONLY valid JSON, no additional text or markdown formatting

Generate 10 questions now:`;
}
