import postgres from 'postgres';
import { Feeling, Song } from "./definitions";

// this needs to be called in route.tsx bc frontend can't execute backend / server

// establish the connection once
const sql = postgres(process.env.DATABASE_URL!, {ssl: 'require'});

// song: {emotion, youtube link}

// return quantity random songs associated with this emotion as a list
export async function getSongs(emotion: keyof typeof Feeling, quantity: number){
    try {
        // Get the emotion criteria
        if (!(emotion in Feeling)) {
            throw new Error(`Invalid emotion: ${String(emotion)}`);
        }
        const { labels, valence, energy } = Feeling[emotion];
        
        // Build the SQL query dynamically based on criteria
        const whereConditions: string[] = [];
        
        // Add labels condition if not -1
        if (labels !== -1) {
            whereConditions.push(`labels = ${labels}`);
        }
        
        // Add valence condition if not -1 (handle both array and number types)
        if (Array.isArray(valence) && valence[0] !== -1 && valence[1] !== -1) {
            whereConditions.push(`valence BETWEEN ${valence[0]} AND ${valence[1]}`);
        }
        
        // Add energy condition if not -1 (handle both array and number types)
        if (Array.isArray(energy) && energy[0] !== -1 && energy[1] !== -1) {
            whereConditions.push(`energy BETWEEN ${energy[0]} AND ${energy[1]}`);
        }
        
        // If no conditions, return random songs
        let songs;
        if (whereConditions.length === 0) {
            songs = await sql`
                SELECT uri, tempo
                FROM songs 
                ORDER BY RANDOM()
                LIMIT ${quantity}
            `;
        } else {
            // Combine all conditions
            const whereClause = whereConditions.join(' AND ');
            
            // Execute the query with conditions
            songs = await sql`
                SELECT uri, tempo
                FROM songs 
                WHERE ${sql.unsafe(whereClause)}
                ORDER BY RANDOM()
                LIMIT ${quantity}
            `;
        }
        
        // Format results to match Song type
        return songs.map(song => ({
            id: song.uri.split(':')[2], // Extract Spotify ID from URI
            name: "", // Empty string - will fill with Spotify api later
            tempo: song.tempo
        }));
        
    } catch (error) {
        console.error('Error fetching songs:', error);
        throw new Error('Failed to fetch songs from database');
    }
}