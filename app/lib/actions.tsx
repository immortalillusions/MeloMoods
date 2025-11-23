// 'use server';
// import { Emotion } from "./definitions";

// // user can manually add songs to queue from recommended section
// // user can also just directly play a song from recommended section
// // if no songs in queue, the first recommended song will play when current song is skipped
// // update recommended section every 10s based on emotions -- weighted average emotions felt in the 10s span


// song recommendation based on moods
// used 278k emotion labelled songs from kaggle Moodify database to give mood tailored recommendations
// 7 emotions - neutral, happiness, sadness, anger, fear, disgust, surprise - songs are recommended not based on content but rather energy & valence (positivity)

// manual mode: select your emotion and it'll recommend 5 songs tailored based on energy level and valence (positivity)
// auto mode: use AI to detect face + emotions; face detection pretrained model is from face-api.js, trained the emotions detection from RAF-DB database (15K+ images) 30 epochs 99.1% training accuracy 3 layers
// light / dark mode

// can queue recommended songs

// if queue is empty, select a random song from recommended list instead - used queue, map, set to ensure we dont play repeat any recently played songs (last 10)
// we used Spotify's IFrameAPI to detect when the song ends so that it'd auto play songs
