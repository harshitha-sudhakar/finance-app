import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "runway",
    nessieConfigured: Boolean(process.env.NESSIE_API_KEY),
    firebaseConfigured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  });
}
