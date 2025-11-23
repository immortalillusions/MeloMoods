"use client";
import Image from "next/image";

const EMOTION_TO_IMAGE: Record<string, string> = {
  neutral: "https://media.tenor.com/U0g9h6ghFGMAAAAj/pikachu-nodding.gif",
  happiness: "https://gifdb.com/images/high/transparent-anime-cute-chibi-long-hair-vzi7f8mfb59itraj.gif",
  sadness: "https://media.tenor.com/Cb9h2LJKY2cAAAAj/jinzhan-lily-and-marigold.gif",
  anger: "https://media.tenor.com/ZUM0faO_IAYAAAAj/mystic-messenger-video-game.gif",
  fear: "https://media.tenor.com/bfaOqOKHdO4AAAAj/shaking-scared.gif",
  disgust: "https://i.imgflip.com/acydw7.gif",
  surprise: "https://media.tenor.com/JGS6oB1eaHMAAAAj/707-mystic-messenger.gif",
};

export default function MoodAvatar({ emotion }: { emotion: string }) {
  const src = EMOTION_TO_IMAGE[emotion] || EMOTION_TO_IMAGE["neutral"];

  return (
    <div className="flex flex-col items-center gap-2 h-[36px]">
      <Image
        src={src}
        alt={emotion}
        width={36}
        height={36}
        unoptimized
        className="rounded-md object-contain bg-black/20 p-1"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
