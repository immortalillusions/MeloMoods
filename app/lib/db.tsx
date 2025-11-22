import postgres from 'postgres';
import { Feeling, Song } from "./definitions";
import he from "he";


// establish the connection once
const sql = postgres(process.env.DATABASE_URL!, {ssl: 'require'});

const songNameCache = new Map<string, string>();


async function getSpotifySongName(songId: string): Promise<string> {
  if (songNameCache.has(songId)) {
    return songNameCache.get(songId)!;
  }

  try {
    const response = await fetch(`https://open.spotify.com/track/${songId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitleMatch) {
      const songName = he.decode(ogTitleMatch[1].trim());
      songNameCache.set(songId, songName);
      return songName;
    }
    
    const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (ogDescMatch) {
      const songName = he.decode(ogDescMatch[1].trim());
      songNameCache.set(songId, songName);
      return songName;
    }
    
    return 'Unknown Song';
  } catch (error) {
    console.error(`Error fetching song name for ${songId}:`, error);
    return 'Unknown Song';
  }
}

// Main function: get songs and resolve names
export async function getSongs(emotion: keyof typeof Feeling, quantity: number): Promise<Song[]> {
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
    
    // Fetch songs from database
    let songs;
    if (whereConditions.length === 0) {
      songs = await sql`
        SELECT uri, tempo
        FROM songs 
        ORDER BY RANDOM()
        LIMIT ${quantity}
      `;
    } else {
      const whereClause = whereConditions.join(' AND ');
      songs = await sql`
        SELECT uri, tempo
        FROM songs 
        WHERE ${sql.unsafe(whereClause)}
        ORDER BY RANDOM()
        LIMIT ${quantity}
      `;
    }
    
    // Resolve song names in parallel
    const songsWithNames = await Promise.all(
      songs.map(async (song) => {
        const spotifyId = song.uri.split(':')[2]; // Extract Spotify ID from URI
        const songName = await getSpotifySongName(spotifyId);
        
        return {
          id: spotifyId,
          name: songName,
          tempo: song.tempo
        };
      })
    );
    
    return songsWithNames;
    
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw new Error('Failed to fetch songs from database');
  }
}

export function clearSongNameCache(): void {
  songNameCache.clear();
}