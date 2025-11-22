import postgres from 'postgres';
import { Emotion } from "./definitions";

// establish the connection once
const sql = postgres(process.env.DATABASE_URL!, {ssl: 'require'});

// song: {emotion, youtube link}

// return quantity random songs associated with this emotion as a list
export async function getSongs(emotion: Emotion, quantity: number){
    // sql
}