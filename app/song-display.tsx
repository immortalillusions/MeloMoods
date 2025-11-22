'use client'
import { useState } from "react"

// call the processing in page.tsx (backend) -> pass the randomized 10 list as a prop here
export default function SongDisplay() {
    // add a button to clear recommended list and queue list
    const [recommended, setRecommended] = useState(Array(10).fill(null))

    const [songQueue, setSongQueue] = useState(Array(5).fill(null))

    const [songId, setSongId] = useState("3v6sBj3swihU8pXQQHhDZo")
    return(
        <>
            <iframe
                src={`https://open.spotify.com/embed/track/${songId}`}
                width="300"
                height="380"
                allow="encrypted-media">
            </iframe>
            <button
                onClick={() => setSongId("7KCWmFdw0TzoJbKtqRRzJO")}
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
        </>
    )
}