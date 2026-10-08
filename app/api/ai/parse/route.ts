import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseTaskWithAI } from "@/services/aiService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, current_datetime, image_base64, image_mime_type } =
      await req.json();

    const hasText = Boolean(text && text.trim());
    const hasImage = Boolean(image_base64 && image_base64.trim());

    if (!hasText && !hasImage) {
      return NextResponse.json(
        { error: "Teks tugas atau gambar wajib disertakan." },
        { status: 400 }
      );
    }

    const parsed = await parseTaskWithAI(
      hasText ? text.trim() : "",
      current_datetime,
      hasImage ? image_base64 : undefined,
      image_mime_type
    );

    return NextResponse.json({ task: parsed });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memproses parsing tugas AI.";
    console.error("POST /api/ai/parse error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
