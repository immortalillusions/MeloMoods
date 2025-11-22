'use client'
import { useState } from "react"
import {Queue, Song} from './lib/definitions'

// call the processing in page.tsx (backend) -> pass the randomized 5 list as a prop here
// when play next button is pressed -> update songQueue, songId
// if queue is empty, plays a non recently played (within last 10 songs) song from recommended list

const songQueue = new Queue<Song>()

// ensure the last 10 songs are not repeated
// freq map, set, queue - when we play a new song, add to queue + set + update freq, popqueue if >10, -- freq[e], if freq == 0, remove from set
// when we recommend song, ensure it's not in set
const freq = new Map<string, number>();
const lastTenSongs = new Set<string>();
const lastSongsQueue = new Queue<Song>();

export default function SongDisplay() {
    // add a button to clear recommended list and queue list
    const [recommended, setRecommended] = useState<(Song | null)[]>(Array(5).fill(null))

    // trigger re-renders when queue changes
    const [queueVersion, setQueueVersion] = useState(0)

    const [songId, setSongId] = useState("3v6sBj3swihU8pXQQHhDZo")

    // update the last 10 recently played list
    const addToRecentlyPlayed = (song: Song) => {
        // Add to set and update frequency
        lastTenSongs.add(song.id);
        freq.set(song.id, (freq.get(song.id) || 0) + 1);
        lastSongsQueue.enqueue(song);

        // If we have more than 10 songs, remove the oldest
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
    
    // Function to add song to queue (FIFO)
    const addToQueue = (song: Song | null) => {
        if (song) {
            songQueue.enqueue(song);
            setQueueVersion(prev => prev + 1); // Force re-render

        }
    };

    // Function to remove song from queue by index
    const removeFromQueue = (index: number) => {
        songQueue.remove(index);
        setQueueVersion(prev => prev + 1); // Force re-render

    };

    // Function to play next song (top song)
    const playNextSong = () => {
        const nextSong = songQueue.dequeue();
        if (nextSong) {
            setSongId(nextSong.id);
            addToRecentlyPlayed(nextSong); // Track the song
            setQueueVersion(prev => prev + 1); // Force re-render
        } else {
            // play a random song from the recommended
            // ensure the random song hasn't played in the last 10 songs
            const availableSongs = recommended.filter(song => 
                song !== null && !lastTenSongs.has(song.id)
            ) as Song[];
            
            if (availableSongs.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableSongs.length);
                const randomSong = availableSongs[randomIndex];
                setSongId(randomSong.id);
                addToRecentlyPlayed(randomSong); // Track the song
            } else {
                // If all recommended songs are in last 10, just pick any random one
                const nonNullRecommended = recommended.filter(song => song !== null) as Song[];
                if (nonNullRecommended.length > 0) {
                    const randomIndex = Math.floor(Math.random() * nonNullRecommended.length);
                    const randomSong = nonNullRecommended[randomIndex];
                    setSongId(randomSong.id);
                    addToRecentlyPlayed(randomSong);
                }
            }
        }
    };    // Function to populate recommended list (placeholder)
    const populateRecommended = () => {
        setRecommended([
            { id: "7KCWmFdw0TzoJbKtqRRzJO", name: "Sample Song 1" , tempo: 128.05},
            { id: "2CY92qejUrhyPUASawNVRr", name: "Sample Song 2" , tempo: 40},
            { id: "11BPfwVbB7vok7KfjBeW4k", name: "Sample Song 3" , tempo: 20},
            { id: "3v6sBj3swihU8pXQQHhDZo", name: "Sample Song 4" , tempo: 100},
            { id: "5ZWMcomAviWuMGZWbBxmGd", name: "Sample Song 5" , tempo: 80}
        ]);
    };

    return(
        <div className="flex gap-6 p-4">
            {/* Spotify Player */}
            <div className="flex flex-col">
                <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Now playing [x]!!
                </h1>
                <br></br>
                <iframe
                    src={`https://open.spotify.com/embed/track/${songId}`}
                    width="400"
                    height="400"
                    allow="encrypted-media">
                </iframe>
                <button
                    onClick={playNextSong}
                    style={{ marginTop: "12px", padding: "8px 14px" }}
                    className="
                        mt-4 px-4 py-2 
                        rounded-full 
                        bg-[#1db954] 
                        text-black font-semibold 
                        hover:bg-[#1ed760] 
                        transition-colors 
                        shadow-md hover:shadow-lg
                    ">
                    Next Song
                </button>
                <button
                    onClick={populateRecommended}
                    style={{ marginTop: "8px", padding: "8px 14px" }}
                    className="
                        mt-2 px-4 py-2 
                        rounded-full 
                        bg-purple-600 
                        text-white font-semibold 
                        hover:bg-purple-700 
                        transition-colors 
                        shadow-md hover:shadow-lg
                    ">
                    Get Recommendations
                </button>
            </div>

            {/* Queue and Recommended Lists */}
            <div className="flex flex-col gap-4 w-80">
                {/* Queue Box */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 text-lg">Queue ({songQueue.size()} songs)</h3>
                    <div className="space-y-2 h-60 overflow-y-auto" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#6b7280 #374151'
                    }}>
                        <style jsx>{`
                            div::-webkit-scrollbar {
                                width: 8px;
                            }
                            div::-webkit-scrollbar-track {
                                background: #374151;
                                border-radius: 4px;
                            }
                            div::-webkit-scrollbar-thumb {
                                background: #6b7280;
                                border-radius: 4px;
                            }
                            div::-webkit-scrollbar-thumb:hover {
                                background: #9ca3af;
                            }
                        `}</style>
                        {songQueue.size() === 0 ? (
                            <div className="p-2 bg-gray-700 rounded">
                                <span className="text-gray-400 text-sm">Queue is empty</span>
                            </div>
                        ) : (
                            songQueue.getArray().map((song, index) => (
                                <div key={`${song.id}-${index}`} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                    <span className="text-white text-sm truncate flex-1">
                                        {song.name}
                                    </span>
                                    <button
                                        onClick={() => removeFromQueue(index)}
                                        className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold ml-2"
                                    >
                                        -
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recommended Box */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 text-lg">Recommended</h3>
                    <div className="space-y-2 h-60">
                        {recommended.map((song, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                {song ? (
                                    <>
                                        <span className="text-white text-sm truncate flex-1">
                                            {song.name}
                                        </span>
                                        <button
                                            onClick={() => addToQueue(song)}
                                            className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold ml-2"
                                        >
                                            +
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-gray-400 text-sm">No recommendation {index + 1}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}