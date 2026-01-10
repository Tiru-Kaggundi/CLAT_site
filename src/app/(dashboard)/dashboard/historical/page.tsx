import { getCurrentUser } from "@/server-actions/auth";
import { getEarliestQuestionSetDate } from "@/server-actions/questions";
import { HistoricalPracticeClient } from "./HistoricalPracticeClient";

export default async function HistoricalPracticePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const earliestDate = await getEarliestQuestionSetDate();

  return <HistoricalPracticeClient earliestDate={earliestDate} />;
}
