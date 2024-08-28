import axios from 'axios';
import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export async function GET(request) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY is not defined');
    return NextResponse.json({ message: 'API_KEY is not defined' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '43.6532,-79.3832'; // Default location if not provided
  const radius = searchParams.get('radius') || 10000; // Default 10 km radius
  const keyword = searchParams.get('keyword') || 'food';

  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=restaurant&keyword=${keyword}&key=${apiKey}`;

  try {
    const placesResponse = await axios.get(placesUrl);
    const placesData = placesResponse.data;

    if (placesData.status === 'OK') {
      if (placesData.results && placesData.results.length > 0) {
        const specificCuisines = {
          Italian: ['italian'],
          Japanese: ['japanese'],
          Indian: ['indian'],
          Mexican: ['mexican'],
          Chinese: ['chinese'],
          French: ['french'],
          Vegan: ['vegan'],
          Thai: ['thai'],
          Spanish: ['spanish'],
          American: ['american'],
          British: ['british'],
          Deli: ['deli'],
        };

        // Fetch details for each place to get reviews
        const detailsPromises = placesData.results.map(async (place) => {
          const placeId = place.place_id;
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,types,reviews&key=${apiKey}`;
          const detailsResponse = await axios.get(detailsUrl);
          const detailsData = detailsResponse.data;

          const reviews = detailsData.result.reviews || [];
          const reviewText = reviews.length > 0 ? reviews[0].text : 'No reviews available';

          const name = detailsData.result.name;
          const rating = detailsData.result.rating || 'N/A';
          const types = detailsData.result.types || [];

          let cuisine = 'Fast-food';
          for (const [specificCuisine, keywords] of Object.entries(specificCuisines)) {
            if (
              keywords.some((keyword) => types.join(' ').toLowerCase().includes(keyword)) ||
              keywords.some((keyword) => name.toLowerCase().includes(keyword))
            ) {
              cuisine = specificCuisine;
              break;
            }
          }

          return {
            name,
            rating,
            cuisine,
            review: reviewText,
          };
        });

        // Wait for all details to be fetched
        const detailedPlaces = await Promise.all(detailsPromises);

        return NextResponse.json(detailedPlaces, { status: 200 });
      } else {
        return NextResponse.json(
          { message: 'No restaurants found within the specified radius.' },
          { status: 200 },
        );
      }
    } else {
      return NextResponse.json(
        { message: 'Request Failed', error: placesData.error_message },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Request Failed', error: error.message }, { status: 500 });
  }
}
