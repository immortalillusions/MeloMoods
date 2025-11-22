
// emotions = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised'

// -1, -1, -1 -> irrelevant
// Labels: {'sad': 0, 'happy': 1, 'energetic': 2, 'calm': 3}
// valence: 0 (negative) - 1 (positive)
// energy: 0-1
export const Feeling = {
    neutral: {labels: -1, valence: -1, energy: -1},
    happy: {labels: 1, valence: [0.7, 1], energy: -1},
    sad: {labels: 0, valence: -1, energy: -1},
    angry: {labels: -1, valence: -1, energy: -1},
    fearful: {labels: -1, valence: -1, energy: -1},
    disgusted: {labels: -1, valence: -1, energy: -1},
    surprised: {labels: -1, valence: -1, energy: -1}
}

export type Emotion = { 
    // feeling can only be none, happy, etc
    // keyof typeof Feeling gives all of the keys
    // so feeling is NEUTRAL, HAPPY, SAD, ANGRY etc
    feeling: keyof typeof Feeling,
    confidence: number
}