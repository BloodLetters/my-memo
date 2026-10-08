import {
  parseTaskWithGeminiDirect,
  ParsedTaskItem,
  TaskParseResult,
} from "./aiParserService";

export type { ParsedTaskItem };
export type ParsedTaskResult = TaskParseResult;

export async function parseTaskWithAI(
  text: string,
  clientDatetime?: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<ParsedTaskResult> {
  // If user explicitly configured an external AI backend URL other than default localhost:8001
  const customAiUrl = process.env.AI_BASE_URL;
  if (customAiUrl && customAiUrl !== "http://localhost:8001" && customAiUrl.startsWith("http")) {
    try {
      console.log(`[AI Service] Mengirim request ke external AI backend: ${customAiUrl}`);
      const response = await fetch(`${customAiUrl}/api/ai/tasks/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text || "",
          image_base64: imageBase64 || null,
          image_mime_type: imageMimeType || "image/jpeg",
          current_datetime: clientDatetime || new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || "",
          description: data.description || "",
          priority: data.priority || "MEDIUM",
          deadline: data.deadline || null,
          category: data.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          multiple_tasks: Array.isArray(data.multiple_tasks) ? data.multiple_tasks : [],
          model_used: data.model_used,
        };
      }
    } catch (err) {
      console.warn("[AI Service] External AI failed, falling back to Next.js native parser:", err);
    }
  }

  // Native Next.js execution (Serverless on Vercel ready)
  return await parseTaskWithGeminiDirect({
    text,
    clientDatetime,
    imageBase64,
    imageMimeType,
  });
}
