import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildQuestionPrompt } from "./prompt-templates";
import { questionSetSchema, type QuestionSetInput } from "@/lib/validations/question-schema";
import { formatIST } from "@/lib/utils/date";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate 10 GK MCQs using Gemini with Google Search grounding
 */
export async function generateQuestions(): Promise<QuestionSetInput> {
  // Calculate date boundaries
  const now = new Date();
  
  // Calculate 72 hours ago (in milliseconds)
  const date72HoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  
  // Calculate 1 week ago (7 days in milliseconds)
  const date1WeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Format dates for the prompt in IST timezone
  const currentDateStr = formatIST(now, "MMMM d, yyyy, h:mm a 'IST'");
  const date72HoursAgoStr = formatIST(date72HoursAgo, "MMMM d, yyyy, h:mm a 'IST'");
  const date1WeekAgoStr = formatIST(date1WeekAgo, "MMMM d, yyyy, h:mm a 'IST'");
  
  // Build the prompt with date context
  const prompt = buildQuestionPrompt(currentDateStr, date72HoursAgoStr, date1WeekAgoStr);
  
  // Try multiple model names in order of preference
  // Prioritize Gemini 3 Flash first, then fallback to other models with grounding support
  // Note: Grounding is REQUIRED for fetching recent news (last 72 hours)
  const modelNames = [
    "gemini-3-flash-preview", // Gemini 3 Flash Preview - latest model, try first
    "gemini-2.0-flash-exp", // Gemini 2.0 Flash Experimental - best grounding support
    "gemini-2.0-flash", // Gemini 2.0 Flash - good grounding support
    "gemini-1.5-pro", // Gemini 1.5 Pro - reliable with grounding
    "gemini-1.5-flash", // Gemini 1.5 Flash - supports grounding
    "gemini-2.5-flash", // Gemini 2.5 Flash - may have grounding
    "gemini-1.5-flash-latest", // Latest 1.5 Flash
  ];

  let lastError: Error | null = null;

  // Try each model name until one works
  for (const modelName of modelNames) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      // First try with search grounding - REQUIRED for recent news
      let model = genAI.getGenerativeModel({
        model: modelName,
        tools: [
          {
            googleSearch: {},
          },
        ],
      });

      let result;
      let groundingWorked = false;
      let groundingConfig = "googleSearch";
      
      // Try googleSearch first (recommended for newer models)
      try {
        result = await model.generateContent(prompt);
        groundingWorked = true;
        console.log(`Search grounding (googleSearch) successful for ${modelName}`);
      } catch (groundingError) {
        // Log the actual error for debugging
        const errorMessage = groundingError instanceof Error ? groundingError.message : String(groundingError);
        console.warn(`Search grounding (googleSearch) failed for ${modelName}:`, errorMessage);
        
        // Try alternative syntax (googleSearchRetrieval for older models)
        try {
          console.log(`Trying alternative grounding syntax (googleSearchRetrieval) for ${modelName}`);
          model = genAI.getGenerativeModel({
            model: modelName,
            tools: [
              {
                googleSearchRetrieval: {
                  dynamicRetrievalConfig: {
                    mode: "MODE_DYNAMIC",
                    dynamicThreshold: 0.3,
                  },
                },
              },
            ],
          });
          result = await model.generateContent(prompt);
          groundingWorked = true;
          groundingConfig = "googleSearchRetrieval";
          console.log(`Alternative grounding syntax (googleSearchRetrieval) worked for ${modelName}`);
        } catch (altError) {
          // If both fail, throw an error - we need grounding for recent news
          const altErrorMessage = altError instanceof Error ? altError.message : String(altError);
          console.error(`Both grounding methods failed for ${modelName}`);
          console.error(`googleSearch error: ${errorMessage}`);
          console.error(`googleSearchRetrieval error: ${altErrorMessage}`);
          throw new Error(
            `Search grounding is REQUIRED for recent news but failed for ${modelName}. ` +
            `Tried both googleSearch and googleSearchRetrieval. ` +
            `Errors: ${errorMessage} | ${altErrorMessage}. ` +
            `Please ensure: 1) Your API key has access to Google Search grounding, ` +
            `2) The model supports grounding (try gemini-2.0-flash-exp or gemini-1.5-pro), ` +
            `3) Your API key is valid and has sufficient quota.`
          );
        }
      }
      
      const response = await result.response;
      
      // Check if grounding was actually used (if metadata is available)
      try {
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const candidate = candidates[0];
          // Check for grounding metadata in the response
          if (candidate.groundingMetadata) {
            console.log(`✓ Grounding was used (${groundingConfig}) - sources found:`, 
              candidate.groundingMetadata.webSearchQueries?.length || 0);
          } else {
            console.warn(`⚠ Warning: Grounding may not have been used despite being configured. ` +
              `The model might not have needed to search, or grounding metadata is not available.`);
          }
        }
      } catch (metadataError) {
        // Metadata check failed, but continue - response might still be valid
        console.warn(`Could not verify grounding metadata:`, metadataError);
      }
      
      const text = response.text();

      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      // Parse and validate
      const parsed = JSON.parse(jsonText);
      const validated = questionSetSchema.parse(parsed);

      console.log(`Successfully generated questions using model: ${modelName}`);
      return validated;
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error instanceof Error ? error.message : "Unknown error");
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model
      continue;
    }
  }

  // If all models failed, throw the last error
  throw new Error(
    `Failed to generate questions with any available model. Last error: ${lastError?.message || "Unknown error"}. Please check your GEMINI_API_KEY and available models.`
  );
}
