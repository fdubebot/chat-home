import { NextResponse } from "next/server";
import { getTopTracks } from "@/lib/spotify";

export async function GET() {
  try {
    const tracks = await getTopTracks();
    return NextResponse.json({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Spotify data unavailable",
        detail: message,
      },
      { status: 503 },
    );
  }
}
