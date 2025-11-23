"use client";
import { useState, useEffect, useRef } from "react";
import { Music, Volume2, Plus, X, Sparkles } from "lucide-react";

interface Window {
  onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
}
declare let window: Window;

export default function SongDisplay({
  recommended,
  setRecommended,
}: {
  recommended?: any[]; // <-- now optional
  setRecommended: (r: any[]) => void;
}) {
  const [songQueue, setSongQueue] = useState<any[]>([]);
  const [currentSong, setCurrentSong] = useState<any | null>(null);

  const controllerRef = useRef<any>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);

  const queueRef = useRef<any[]>([]);
  const currentSongRef = useRef<any>(null);
  const recommendedRef = useRef<any[]>([]);

  useEffect(() => {
    queueRef.current = songQueue;
  }, [songQueue]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    recommendedRef.current = Array.isArray(recommended) ? recommended : [];
  }, [recommended]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      if (!embedContainerRef.current) return;

      const element = embedContainerRef.current;
      const options = {
        uri: "",
        width: "100%",
        height: "100%",
      };
       IFrameAPI.createController(element, options, (controller: any) => {
        controllerRef.current = controller;

        controller.addListener("ready", () => {
          if (currentSongRef.current) {
            controller.loadUri(`spotify:track:${currentSongRef.current.id}`);
          }
        });

        controller.addListener("playback_update", (e: any) => {
          if (e.data.position >= e.data.duration - 150) {
            playNextSong();
          }
        });
      });
    };
  }, []);

  // --- Queue Operations ---
  function enqueue(song: any) {
    setSongQueue((prev) => [...prev, song]);
  }

  function dequeue() {
    let next = null;
    setSongQueue((prev) => {
      if (prev.length === 0) return prev;
      next = prev[0];
      return prev.slice(1);
    });
    return next;
  }

  function playNextSong() {
    // 1️⃣ Prioritize queue
    if (queueRef.current.length > 0) {
      const next = dequeue();
      if (next) {
        setCurrentSong(next);
        return;
      }
    }

    // 2️⃣ Fallback to recommended
    const rec = recommendedRef.current;
    if (rec.length > 0) {
      setCurrentSong(rec[0]);
    }
  }

  // --- Load current song in Spotify iframe ---
  useEffect(() => {
    if (!controllerRef.current || !currentSong) return;

    const uri =
      currentSong.uri ||
      currentSong.track_uri ||
      currentSong.spotify_uri ||
      `spotify:track:${currentSong.id}`;

    try {
      controllerRef.current.loadUri(uri);
      controllerRef.current.play();
    } catch (err) {
      console.error("Failed to play song:", err);
    }
  }, [currentSong]);

  // --- Render ---
  const safeRecommended = Array.isArray(recommended) ? recommended : [];

  return (
    <div className="flex gap-8 bg-[#0d0d0d] p-6 rounded-2xl shadow-2xl border border-white/5 items-stretch">
      {/* Player Section */}
      <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/10 shadow-xl w-[360px] h-full">
        <div
          ref={embedContainerRef}
          className="rounded-xl overflow-hidden shadow-xl border border-white/10 w-full aspect-video"
        ></div>

        <button
          onClick={playNextSong}
          className="mt-4 px-6 py-2 rounded-xl font-semibold bg-[#1db954] hover:bg-[#1ed760] text-black transition shadow-md"
        >
          Next Song
        </button>
      </div>

      {/* Sidebar Panels */}
      <div className="flex flex-col gap-6 w-[340px]">
        {/* Queue */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 shadow-lg h-[290px] overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4 opacity-90">Queue</h3>

          {songQueue.length === 0 ? (
            <div className="text-sm text-white/40">Empty</div>
          ) : (
            <div className="space-y-3">
              {songQueue.map((song, i) => (
                <div
                  key={song.id + i}
                  className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 shadow-sm"
                >
                  <span className="truncate text-sm">{song.name}</span>

                  <button
                    onClick={() =>
                      setSongQueue((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm shadow"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg h-96 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#1db954]" />
            <h3 className="font-semibold">Recommended</h3>
          </div>
          {safeRecommended.length === 0 ? (
            <p className="text-sm text-white/40">No recommendations yet</p>
          ) : (
            <div className="space-y-2">
              {safeRecommended.map((song, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors group"
                >
                  <span className="text-sm truncate flex-1">
                    {song?.name || `Song ${i + 1}`}
                  </span>
                  <button
                    onClick={() => enqueue(song)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Plus className="w-4 h-4 text-[#1db954]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
