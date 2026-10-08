import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Pendaftaran akun baru telah dinonaktifkan." },
    { status: 403 }
  );
}
