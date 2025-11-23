# MeloMoods 🎵

A mood-based music recommendation system that tailors Spotify song suggestions to your emotional state using AI emotion detection or manual mood selection.

## Features

### 🎭 Emotion-Based Recommendations
- **7 Emotions Supported**: neutral, happiness, sadness, anger, fear, disgust, surprise
- **Smart Algorithm**: Recommendations based on energy level and valence (positivity) rather than content analysis. For example, an anxious / fearful listener will be recommended mid-tempo, negative songs.
- **Large Dataset**: Powered by 278k emotion-labelled songs from the Kaggle Moodify database

### 🤖 Dual Mode System
- **Manual Mode**: Select your current emotion to get 5 tailored song recommendations
- **Auto Mode**: AI-powered emotion detection through facial recognition
  - Face detection using pre-trained models from face-api.js
  - Custom emotion detection model trained on RAF-DB database (15K+ images)
  - 30 epochs training with 99.1% accuracy using 3-layer architecture

### 🎵 Smart Playback Features
- **Queue System**: Add recommended songs to your personal queue
- **Auto-Play**: Automatic song progression when current track ends
- **Smart Repeat Prevention**: Uses queue, map, and set data structures to avoid repeating recently played songs (last 10 tracks)
- **Fallback System**: Automatically selects random songs from recommendations when queue is empty

### 🎨 User Experience
- **Light/Dark Mode**: Toggle between themes for comfortable viewing
- **Spotify Integration**: Seamless playback using Spotify's IFrame API
- **Real-time Updates**: Live emotion detection updates recommendations every 10 seconds in auto mode
- **Loading States**: Visual feedback during recommendation fetching

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: face-api.js, custom emotion detection model
- **Database**: PostgreSQL with 278k song dataset
- **Music API**: Spotify Web API
- **Deployment**: Vercel

## How It Works

1. **Choose Your Mode**: Select manual emotion input or AI-powered detection
2. **Get Recommendations**: Receive 5 songs tailored to your emotional state
3. **Build Your Queue**: Add favorite recommendations to your playback queue
4. **Enjoy**: Let MeloMoods handle the rest with smart auto-play and variety control

## Database Schema

The application uses a PostgreSQL database with the following structure:
- **Songs table**: Contains URI, tempo, labels, valence, and energy values for 278k songs
- **Labels**: {'sad': 0, 'happy': 1, 'energetic': 2, 'calm': 3}
- **Valence**: 0 (negative) - 1 (positive)
- **Energy**: 0 (low) - 1 (high)

---

*Experience music that truly matches your mood with MeloMoods!* 🎶
