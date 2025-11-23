
// emotions = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised'

// -1, -1, -1 -> irrelevant
// Labels: {'sad': 0, 'happy': 1, 'energetic': 2, 'calm': 3}
// valence: 0 (negative) - 1 (positive)
// energy: 0-1
export const Feeling = {
    neutral: {labels: -1, valence: [-1, -1], energy: [-1, -1]},
    happy: {labels: 1, valence: [0.7, 1], energy: [-1, -1]},
    sad: {labels: 0, valence: [0, 0.1], energy: [0, 0.3]},
    angry: {labels: -1, valence: [0, 0.1], energy: [0.8, 1]},
    fearful: {labels: -1, valence: [0, 0.2], energy: [0.8, 1]},
    disgusted: {labels: -1, valence: [0, 0.2], energy: [0.3, 0.7]},
    surprised: {labels: 2, valence: -1, energy: [0.7, 1]}
}

export type Emotion = { 
    // feeling can only be none, happy, etc
    // keyof typeof Feeling gives all of the keys
    // so feeling is NEUTRAL, HAPPY, SAD, ANGRY etc
    feeling: keyof typeof Feeling,
    confidence: number
}

export type Song = {
    id: string;
    name: string;
    tempo: number
}

// FIFO
export class Queue<T> {
    public items: T[] = [];
    
    enqueue(item: T): void {
        this.items.push(item); // add to back
    }
    
    dequeue(): T | undefined {
        return this.items.shift(); // remove from front
    }   
    
    size(): number {
        return this.items.length;
    }
    
    getArray(): T[] {
        return this.items;
    }
    
    clear(): void {
        this.items = [];
    }
    
    remove(index: number): T | undefined {
        if (index >= 0 && index < this.items.length) {
            // removes 1 elem at index; returns an array of the removed elements
            return this.items.splice(index, 1)[0];
        }
        return undefined;
    }
}