import { fetchNessieSnapshot } from "@/lib/nessie/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const customerId = new URL(request.url).searchParams.get("customerId") ?? undefined;
  const snapshot = await fetchNessieSnapshot(customerId);
  return NextResponse.json(snapshot);
}
