"use client";
import { useState, useEffect, useRef } from "react";
import { Emotion, Queue, Song } from "./lib/definitions";
import EmotionDetector from "./components/EmotionDetector";
import MoodAvatar from "./components/MoodAvatar";

// --- Types for Spotify IFrame API ---
interface IFrameOptions {
  uri: string;
  width?: string;
  height?: string;
  theme?: string;
}

interface IFrameController {
  loadUri: (uri: string) => void;
  play: () => void;
  resume: () => void;
  pause: () => void;
  addListener: (event: string, callback: (data: any) => void) => void;
  destroy: () => void;
}

interface Window {
  onSpotifyIframeApiReady?: (IFrameAPI: {
    createController: (
      element: HTMLElement,
      options: IFrameOptions,
      callback: (controller: IFrameController) => void
    ) => void;
  }) => void;
}
declare let window: Window;

// --- Global State for Queue (Preserving your logic) ---
const songQueue = new Queue<Song>();
const freq = new Map<string, number>();
const lastTenSongs = new Set<string>();
const lastSongsQueue = new Queue<Song>();

export default function Home() {
  const[mood, setMood] = useState<(string)>("neutral");
  // --- UI State ---
  const [AI, setAI] = useState(false);
  const [isDark, setIsDark] = useState(true); // Default to dark mode
  const [isLoading, setIsLoading] = useState(false); // Loading state for recommendations

  const [recommended, setRecommended] = useState<(Song | null)[]>(
    Array(5).fill(null)
  );
  const [currentEmotion, setCurrentEmotion] = useState<string>("");
  const [, setQueueVersion] = useState(0); // Force re-render for queue updates
  
  // --- Player State ---
  const [songId, setSongId] = useState("1yn5VIHdxIlVMPRdQzR2sm");
  
  // --- Refs (Crucial for Autoplay) ---
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<IFrameController | null>(null);
  
  // We need refs for these so the Spotify event listener can access the latest data
  // without stale closures.
  const recommendedRef = useRef<(Song | null)[]>([]);
  const lastTenSongsRef = useRef<Set<string>>(lastTenSongs);

  // Sync refs with state/globals
  useEffect(() => {
    recommendedRef.current = recommended;
  }, [recommended]);

  // --- Logic: Recently Played ---
  const addToRecentlyPlayed = (song: Song) => {
    lastTenSongs.add(song.id);
    lastTenSongsRef.current = lastTenSongs; // Update ref
    freq.set(song.id, (freq.get(song.id) || 0) + 1);
    lastSongsQueue.enqueue(song);

    if (lastSongsQueue.size() > 10) {
      const oldestSong = lastSongsQueue.dequeue();
      if (oldestSong) {
        const currentFreq = freq.get(oldestSong.id) || 0;
        if (currentFreq <= 1) {
          freq.delete(oldestSong.id);
          lastTenSongs.delete(oldestSong.id);
        } else {
          freq.set(oldestSong.id, currentFreq - 1);
        }
      }
    }
  };

  // --- Logic: Queue Management ---
  const addToQueue = (song: Song | null) => {
    if (song) {
      songQueue.enqueue(song);
      setQueueVersion((prev) => prev + 1);
    }
  };

  const removeFromQueue = (index: number) => {
    songQueue.remove(index);
    setQueueVersion((prev) => prev + 1);
  };

  const playNextSong = () => {
    const nextSong = songQueue.dequeue();
    
    if (nextSong) {
      setSongId(nextSong.id);
      addToRecentlyPlayed(nextSong);
      setQueueVersion((prev) => prev + 1);
    } else {
      const currentRecs = recommendedRef.current;
      
      const availableSongs = currentRecs.filter(
        (song) => song !== null && !lastTenSongsRef.current.has(song.id)
      ) as Song[];

      if (availableSongs.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        const randomSong = availableSongs[randomIndex];
        setSongId(randomSong.id);
        addToRecentlyPlayed(randomSong);
      } else {
        const nonNullRecommended = currentRecs.filter(
          (song) => song !== null
        ) as Song[];
        
        if (nonNullRecommended.length > 0) {
          const randomIndex = Math.floor(Math.random() * nonNullRecommended.length);
          const randomSong = nonNullRecommended[randomIndex];
          setSongId(randomSong.id);
          addToRecentlyPlayed(randomSong);
        }
      }
    }
  };

  const getRecommendationsByEmotion = async (emotion: string) => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/recommendSong?emotion=${emotion}&quantity=5`
      );
      const data = await response.json();
      
      if (response.ok) {
        const songs = data.songs || [];
        setRecommended(
          songs.concat(Array(Math.max(0, 5 - songs.length)).fill(null))
        );
        setCurrentEmotion(emotion);
      } else {
        console.error("Error fetching recommendations:", data.error);
        setRecommended(Array(5).fill(null));
        setCurrentEmotion("");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommended(Array(5).fill(null));
      setCurrentEmotion("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed-podcast/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = embedContainerRef.current;
      if (!element) return;

      const options = {
        uri: `spotify:track:${songId}`,
        width: "100%",
        height: "355px",
        theme: isDark ? "dark" : "light",
      };

      IFrameAPI.createController(element, options, (controller) => {
        controllerRef.current = controller;

        controller.addListener("playback_update", (e) => {
            if (e.data.position > 0 && e.data.position >= e.data.duration - 100) {
               playNextSong(); 
            }
        });
      });
    };

    return () => {
    };
  }, []);

  useEffect(() => {
    if (controllerRef.current && songId) {
      const uri = `spotify:track:${songId}`;
      controllerRef.current.loadUri(uri);
      controllerRef.current.play(); 
    }
  }, [songId]);

  useEffect(() => {
    getRecommendationsByEmotion("neutral");
  }, []);


  return (
    <div
      className={`min-h-screen max-h-screen overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-[url('/stars.gif')] bg-cover bg-center text-white"
          : "bg-gradient-to-br from-green-50 to-green-100 text-gray-900"
      }`}
    >
      <div className="flex gap-6 p-4 h-screen justify-center items-start">
        {/* Left Column: Player & Controls */}
        <div className="flex flex-col w-96">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <h1
              className={`mt-3 text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              MeloMoods
            </h1>
                        <MoodAvatar emotion={mood} />
          </div>

          <div
            className={`rounded-xl overflow-hidden `}
          >
             <div ref={embedContainerRef}   className="rounded-xl overflow-hidden shadow-xl border border-white/10 w-full sm:h-[480px] md:h-[480px] lg:h-[480px]"/>
          </div>

          <button
            onClick={playNextSong}
            className="
                            mt-2 px-6 py-2 
                            rounded-full 
                            bg-[#1db954] 
                            text-black font-bold text-sm uppercase tracking-wider
                            hover:bg-[#1ed760] 
                            transition-all duration-200
                            shadow-lg hover:shadow-xl
                            hover:scale-105
                        "
          >
            Next Song
          </button>

          {/* Toggle Controls */}
          <div className="mt-3 space-y-3">
            {/* Both toggles side by side */}
            <div className="flex items-center justify-between gap-8">
              {/* Left side: Information Icon + Manual/Auto Toggle */}
              <div className="flex items-center space-x-3">
                {/* Information Icon */}
                <div className="relative group">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold cursor-help ${
                      isDark
                        ? "bg-slate-700 text-slate-300 border border-slate-600"
                        : "bg-gray-200 text-gray-600 border border-gray-300"
                    }`}
                  >
                    i
                  </div>
                  {/* Tooltip */}
                  <div
                    className={`absolute bottom-full left-0 mb-2 px-3 py-2 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${
                      isDark
                        ? "bg-slate-800 text-white border border-slate-600"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    Recommendations are<br></br> based on energy & positivity
                  </div>
                </div>

                {/* Manual/Auto Toggle */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${
                      !AI
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    Manual
                  </span>
                  <button
                    onClick={() => setAI(!AI)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      AI ? "bg-[#1db954]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        AI ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      AI
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    Auto
                  </span>
                </div>
              </div>

              {/* Right side: Light/Dark Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-900"
                  }`}
                >
                  Light
                </span>
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    isDark ? "bg-gray-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isDark ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-white" : "text-gray-600"
                  }`}
                >
                  Dark
                </span>
              </div>
            </div>
          </div>

          {/* Emotion Controls */}
          {!AI ? (
            <div className="mt-4">
              <div className="space-y-2">
                {/* Neutral button - full width */}
                <button
                  onClick={() => {
                    getRecommendationsByEmotion("neutral");
                    setMood("neutral");
                  }}
                  disabled={isLoading}
                  className={`
                                        w-full h-9 px-4 py-2 text-sm font-medium rounded-lg 
                                        transition-all duration-200 flex items-center justify-center
                                        ${isLoading 
                                          ? isDark
                                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                          : isDark
                                            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                                            : "bg-white hover:bg-gray-100 text-black border border-gray-300 shadow-sm hover:shadow-lg"
                                        } capitalize
                                    `}
                >
                  {isLoading ? "Loading..." : "neutral"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { emotion: "happiness" },
                    { emotion: "sadness" },
                    { emotion: "anger" },
                    { emotion: "fear" },
                    { emotion: "disgust" },
                    { emotion: "surprise" },
                  ].map(({ emotion }) => (
                    <button
                      key={emotion}
                      onClick={() => {
                        getRecommendationsByEmotion(emotion);
                        setMood(emotion);
                      }}
                      disabled={isLoading}
                      className={`
                                                h-9 px-3 py-2 text-sm font-medium rounded-lg
                                                transition-all duration-200 flex items-center justify-center
                                                ${isLoading 
                                                  ? isDark
                                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                  : isDark
                                                    ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                                                    : "bg-white hover:bg-gray-100 text-black border border-gray-300 shadow-sm hover:shadow-lg"
                                                } capitalize
                                            `}
                    >
                      {isLoading ? "Loading..." : emotion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <div
                className={`rounded-xl p-2 text-center ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border border-gray-200 shadow-lg"
                }`}
              >
                <EmotionDetector
                  onMoodBlock={async (moods) => {
                    if (!moods || moods.length === 0) return;
                    const top = [...moods].sort((a, b) => b.confidence - a.confidence)[0];
                    if (top && top.expression) {
                      console.log("Detected Emotion:", top.expression);
                      await getRecommendationsByEmotion(top.expression);
                      setMood(top.expression);
                    }
                  }}
                />
                <span className={`mt-2 block text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Recommendations update to your mood every 10s.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Queue & Recommended */}
        <div className="flex flex-col gap-2 w-80 h-full">
          {/* Queue Box */}
          <div
            className={`rounded-xl p-4 h-80 ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-gray-200 shadow-lg"
            }`}
          >
            <h3
              className={`font-bold mb-3 text-lg ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              🎵 Queue ({songQueue.size()} songs)
            </h3>
            <div
              className="space-y-2 overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: isDark ? "#1e293b #0f172a" : "#d1d5db #f9fafb",
                maxHeight: "240px",
              }}
            >
               {/* Scrollbar Styles */}
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: ${isDark ? "#0f172a" : "#f9fafb"};
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb {
                  background: ${isDark ? "#1e293b" : "#d1d5db"};
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: ${isDark ? "#334155" : "#9ca3af"};
                }
              `}</style>

              {songQueue.size() === 0 ? (
                <div
                  className={`p-3 rounded-lg text-center ${
                    isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <span className="text-sm">Queue is empty</span>
                </div>
              ) : (
                songQueue.getArray().map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-gray-50 hover:bg-gray-100"
                    } transition-colors`}
                  >
                    <span className={`text-sm truncate flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {song.name}
                    </span>
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold ml-3 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center">
            <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              ✨ Get Recommendations by Mood
            </h4>
          </div>

          {/* Recommended Box */}
          <div
            className={`rounded-xl p-4 h-85 ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-gray-200 shadow-lg"
            }`}
          >
            <h3
              className={`font-bold mb-3 text-lg ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              🎧 Recommended{" "}
              {currentEmotion &&
                `(${
                  currentEmotion.charAt(0).toUpperCase() +
                  currentEmotion.slice(1)
                })`}
            </h3>
            <div
              className="space-y-2"
              style={{ maxHeight: "calc(50vh - 100px)" }}
            >
              {recommended.map((song, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "bg-gray-50 hover:bg-gray-100"
                  } transition-colors`}
                >
                  {song ? (
                    <>
                      <span className={`text-sm truncate flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {song.name}
                      </span>
                      <button
                        onClick={() => addToQueue(song)}
                        className="w-6 h-6 bg-[#1db954] hover:bg-[#1ed760] text-white rounded-full flex items-center justify-center text-xs font-bold ml-3 transition-colors"
                      >
                        +
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-500"
                      }`}
                    >
                      Loading {index + 1}...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}