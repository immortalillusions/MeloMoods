// import postgres from 'postgres';

// const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// export async function POST() {
//     try{

//         await sql.begin(async (sql) => {
//           await sql`
//             CREATE TABLE IF NOT EXISTS songs (
//             id INT PRIMARY KEY,
//             duration INT,
//             danceability FLOAT,
//             energy FLOAT,
//             loudness FLOAT,
//             speechiness FLOAT,
//             acousticness FLOAT,
//             instrumentalness FLOAT,
//             liveness FLOAT,
//             valence FLOAT,
//             tempo FLOAT,
//             spec_rate FLOAT,
//             labels INT,
//             uri VARCHAR(255)
//             );
//         `;
//         await sql`
//         \copy songs FROM '/278k_labelled_uri.csv' DELIMITER ',' CSV HEADER
//         `;

//     });

//     return Response.json({ message: 'Database seeded successfully' });
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//     return Response.json({ error: errorMessage }, { status: 500 });
//   }
// }
