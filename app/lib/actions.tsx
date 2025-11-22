'use server';
import { Emotion } from "./definitions";

// user can manually add songs to queue from recommended section
// user can also just directly play a song from recommended section
// if no songs in queue, the first recommended song will play when current song is skipped
// update recommended section every 10s based on emotions -- weighted average emotions felt in the 10s span

// we can't auto play songs / detect when songs end with iframe embed
// only with Web Playback SDK but that requires spotify premium

// workaround: button that says "next song" - user can press it when the cur song ends or when they want to skip

export async function queueSong(emotion: Emotion){

}