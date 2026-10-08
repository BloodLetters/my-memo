import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export interface ParsedTaskItem {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: string | null;
  category: string;
  tags: string[];
}

export interface TaskParseResult {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: string | null;
  category: string;
  tags: string[];
  multiple_tasks?: ParsedTaskItem[];
  model_used?: string;
}

const DEFAULT_MODELS: string[] = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

const MODEL_TIMEOUT_MS = 12000; // 12 seconds per model attempt

function getAvailableModels(): string[] {
  // If custom comma-separated list of models is provided in env
  if (process.env.LLM_MODELS && process.env.LLM_MODELS.trim()) {
    const customList = process.env.LLM_MODELS.split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (customList.length > 0) return customList;
  }

  // Check configured single primary model first
  if (process.env.LLM_MODEL && process.env.LLM_MODEL.trim()) {
    const single = process.env.LLM_MODEL.trim();
    return [single, ...DEFAULT_MODELS.filter((m) => m !== single)];
  }

  return DEFAULT_MODELS;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Direct Gemini AI Parser inside Next.js (No external Python FastAPI needed)
 */
export async function parseTaskWithGeminiDirect(params: {
  text?: string;
  clientDatetime?: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<TaskParseResult> {
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    "";

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "LLM_API_KEY atau GEMINI_API_KEY belum dikonfigurasi di Environment Variable. Silakan tambahkan API key Anda."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());

  // Determine reference date/time
  let currentDatetime = params.clientDatetime;
  let currentDay = "Unknown";
  if (!currentDatetime) {
    const now = new Date();
    currentDatetime = now.toISOString();
    currentDay = now.toLocaleDateString("id-ID", { weekday: "long" });
  } else {
    try {
      const dt = new Date(currentDatetime);
      currentDay = dt.toLocaleDateString("id-ID", { weekday: "long" });
    } catch {
      currentDatetime = new Date().toISOString();
    }
  }

  const systemInstruction = `Anda adalah asisten AI produktivitas task management multimodal cerdas.
Tugas Anda adalah membaca input bahasa alami pengguna dan/atau gambar yang diunggah (seperti screenshot jadwal kuliah, tabel jadwal perkuliahan, slide materi kuliah, foto papan tulis, tugas/soal, to-do list, lembar kerja, atau catatan), lalu mengekstraknya ke format JSON terstruktur yang ketat.

Waktu saat ini (Reference current local time):
- ISO Datetime: ${currentDatetime}
- Hari ini: ${currentDay}

Pedoman Ekstraksi:
1. title: Judul ringkas, padat, dan jelas (contoh: "Jadwal Perkuliahan Mahasiswa", "Membuat ERD Database", "Selesaikan Tugas Fisika Bab 4").
2. description: Rincian atau ringkasan tugas berdasarkan teks dan isi gambar.
3. priority: Salah satu dari string berikut: "LOW", "MEDIUM", "HIGH", "URGENT". Default: "MEDIUM".
4. deadline: Format string ISO 8601 "YYYY-MM-DDTHH:MM:SS" (misal: "2026-10-09T22:00:00") atau null jika tidak ada tanggal spesifik.
5. category: Kategori atau mata kuliah / domain (misal: "Kuliah", "Tugas", "Pribadi", atau nama hari seperti "Senin").
6. tags: Array string berisi 1-4 kata kunci relevan (misal: ["kuliah", "jadwal"]).
7. multiple_tasks: PENTING! Jika gambar atau teks berupa TABEL JADWAL KULIAH / TIMETABLE (seperti jadwal perkuliahan mingguan) atau berisi beberapa tugas/mata kuliah sekaligus, ekstrak SETIAP MATA KULIAH / TUGAS ke dalam array multiple_tasks:
   Setiap item di multiple_tasks memiliki:
   - title: Nama mata kuliah atau tugas (misal: "Metodologi Penelitian", "Pemrograman Web", "Platform IoT").
   - description: Info jam, SKS, ruangan, dan dosen pengampu (misal: "Senin 10.00-11.40 | Ruang A1 | Dosen: A. Fadlillah").
   - category: Kategori kolom board (misal nama hari: "Senin", "Selasa", "Rabu", "Kamis", "Jumat" ATAU nama kelompok seperti "Tugas Kuliah").
   - priority: "LOW", "MEDIUM", "HIGH", atau "URGENT".
   - deadline: null atau waktu pertemuan berikutnya jika tertera.
   - tags: tag relevan (misal: ["kuliah", "pemweb"]).
   Jika input HANYA berupa 1 tugas tunggal, isi multiple_tasks dengan array kosong [].

Format Output JSON:
{
  "title": "string",
  "description": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "deadline": "YYYY-MM-DDTHH:MM:SS" | null,
  "category": "string",
  "tags": ["string"],
  "multiple_tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "deadline": "YYYY-MM-DDTHH:MM:SS" | null,
      "category": "string",
      "tags": ["string"]
    }
  ]
}

Kembalikan HANYA JSON murni tanpa markdown wrapper.`;

  const promptText = params.text?.trim()
    ? params.text.trim()
    : "Tolong ekstrak tugas dari gambar yang saya lampirkan.";
  const fullPromptText = `${systemInstruction}\n\nUser Input:\n${promptText}`;

  // Prepare multimodal parts
  const promptParts: (string | Part)[] = [];

  if (params.imageBase64 && params.imageBase64.trim()) {
    let rawB64 = params.imageBase64.trim();
    let detectedMime = params.imageMimeType || "image/jpeg";

    if (rawB64.includes("data:") && rawB64.includes(";base64,")) {
      const parts = rawB64.split(";base64,");
      const header = parts[0];
      rawB64 = parts[1];
      const match = header.match(/data:([^;]+)/);
      if (match) detectedMime = match[1];
    }

    promptParts.push({
      inlineData: {
        data: rawB64,
        mimeType: detectedMime,
      },
    });
    console.log(`[Next.js AI] Lampiran gambar terpasang (mime: ${detectedMime}, base64 length: ${rawB64.length})`);
  }

  promptParts.push(fullPromptText);

  // Fallback chain through candidate models
  const candidateModels = getAvailableModels();
  const attemptErrors: string[] = [];

  console.log(`[Next.js AI] Memulai parsing dengan rantai fallback (${candidateModels.length} model)`);

  for (let i = 0; i < candidateModels.length; i++) {
    const modelName = candidateModels[i];
    try {
      console.log(`[Model Attempt ${i + 1}/${candidateModels.length}] Mencoba '${modelName}'...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const response = await withTimeout(
        model.generateContent(promptParts),
        MODEL_TIMEOUT_MS,
        `Timeout ${MODEL_TIMEOUT_MS / 1000}s terlewati untuk model ${modelName}`
      );

      let textOutput = response.response.text().trim();

      // Clean markdown code blocks if present
      if (textOutput.startsWith("```")) {
        textOutput = textOutput.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }

      const data = JSON.parse(textOutput);

      if (!data.title || !String(data.title).trim()) {
        throw new Error("Output model tidak memiliki judul valid.");
      }

      // Normalize priority
      let priority = String(data.priority || "MEDIUM").toUpperCase();
      if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
        priority = "MEDIUM";
      }

      // Normalize tags
      const tags = Array.isArray(data.tags)
        ? data.tags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];

      // Normalize multiple_tasks
      const rawMulti = Array.isArray(data.multiple_tasks) ? data.multiple_tasks : [];
      const normalizedMulti: ParsedTaskItem[] = [];
      for (const item of rawMulti) {
        if (item && item.title && String(item.title).trim()) {
          let itemPri = String(item.priority || "MEDIUM").toUpperCase();
          if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(itemPri)) {
            itemPri = "MEDIUM";
          }
          normalizedMulti.push({
            title: String(item.title).trim(),
            description: String(item.description || "").trim(),
            priority: itemPri as any,
            deadline: item.deadline || null,
            category: String(item.category || "Kuliah").trim(),
            tags: Array.isArray(item.tags)
              ? item.tags.map((t: any) => String(t).trim()).filter(Boolean)
              : [],
          });
        }
      }

      console.log(`[Next.js AI] Berhasil diproses dengan model '${modelName}'!`);

      return {
        title: String(data.title).trim(),
        description: String(data.description || "").trim(),
        priority: priority as any,
        deadline: data.deadline || null,
        category: String(data.category || "Umum").trim(),
        tags,
        multiple_tasks: normalizedMulti,
        model_used: modelName,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[Next.js AI] Model '${modelName}' gagal: ${errMsg}`);
      attemptErrors.push(`${modelName}: ${errMsg}`);
    }
  }

  throw new Error(
    `Semua model Gemini gagal merespons. Rincian error: ${attemptErrors.join(" | ")}`
  );
}
