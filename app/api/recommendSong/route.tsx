import {getSongs} from "../../lib/db"
import {Feeling} from "../../lib/definitions"

export async function GET(request: Request) {
  try {
    // Extract URL parameters
    const { searchParams } = new URL(request.url);
    const emotion = searchParams.get('emotion');
    const quantityParam = searchParams.get('quantity');
    
    // Validate emotion parameter
    if (!emotion) {
      return Response.json({ error: 'Missing emotion parameter' }, { status: 400 });
    }
    
    if (!(emotion in Feeling)) {
      return Response.json({ 
        error: `Invalid emotion: ${emotion}. Valid emotions are: ${Object.keys(Feeling).join(', ')}` 
      }, { status: 400 });
    }
    
    // Parse and validate quantity
    const quantity = quantityParam ? parseInt(quantityParam, 10) : 5;
    if (isNaN(quantity) || quantity < 1 || quantity > 50) {
      return Response.json({ error: 'Quantity must be a number between 1 and 50' }, { status: 400 });
    }

    // Fetch songs
    const songs = await getSongs(emotion as keyof typeof Feeling, quantity);

    return Response.json({
      emotion,
      quantity,
      songs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}