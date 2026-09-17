import { fetchNessieSnapshot } from "@/lib/nessie/client";
import { mapNessieSnapshot } from "@/lib/nessie/map";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { customerId?: string };
  const snapshot = await fetchNessieSnapshot(body.customerId);
  const mapped = mapNessieSnapshot(snapshot);
  return NextResponse.json({ snapshot, mapped });
}
