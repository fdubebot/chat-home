"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Track = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string;
  spotifyUrl: string;
};

export default function SpotifyTopTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/spotify/top-tracks", { cache: "no-store" });
        const data = (await response.json()) as { tracks?: Track[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load Spotify tracks");
        }

        if (mounted) {
          setTracks(data.tracks ?? []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Could not load Spotify tracks");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    const id = setInterval(load, 1000 * 60 * 5);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="card mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Spotify · Top 10</h2>
        <span className="text-xs text-slate-400">Auto-refreshes every 5 min</span>
      </div>

      {loading ? <p className="text-slate-300">Loading tracks…</p> : null}

      {error ? (
        <p className="text-slate-300">Spotify is not connected yet. I can finish this once OAuth is done.</p>
      ) : null}

      {!loading && !error ? (
        <ol className="space-y-3">
          {tracks.map((track, index) => (
            <li key={track.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
              <span className="w-6 text-center text-sm text-slate-400">{index + 1}</span>
              {track.imageUrl ? (
                <Image
                  src={track.imageUrl}
                  alt={track.album}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-slate-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{track.name}</p>
                <p className="truncate text-xs text-slate-400">{track.artists.join(", ")}</p>
              </div>
              <a
                href={track.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Open
              </a>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
