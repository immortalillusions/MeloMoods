
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // NEEDS TO BE A PROMISE
) {
  const { id } = await context.params;

  // 1. Get access token
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        grant_type: "client_credentials"
        }),
  });

  const { access_token } = await tokenRes.json();

  // 2. Get track details
  const trackRes = await fetch(
    `https://api.spotify.com/v1/tracks/${id}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await trackRes.json();

  return Response.json(data);
}
