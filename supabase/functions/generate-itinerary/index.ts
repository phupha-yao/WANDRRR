import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: Missing authentication');
    }

    // Define input validation schema
    const requestSchema = z.object({
      location: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
      interests: z.array(z.string()).max(10, "Maximum 10 interests allowed"),
      screenshots: z.array(z.string()).max(10, "Maximum 10 screenshots allowed"),
      additionalNotes: z.string().max(1000, "Additional notes must be less than 1000 characters").optional(),
      allowAISuggestions: z.boolean().optional()
    });

    // Parse and validate input
    const rawInput = await req.json();
    const validatedInput = requestSchema.parse(rawInput);
    
    const { location, startDate, endDate, interests, screenshots, additionalNotes, allowAISuggestions } = validatedInput;
    
    console.log('Processing itinerary request for:', location, 'from', startDate, 'to', endDate);
    console.log('Interests:', interests);
    console.log('Screenshot count:', screenshots?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the prompt for AI
    const systemPrompt = `You are an expert travel planner. Analyze the provided screenshots and user preferences to create an optimized daily itinerary.

Consider:
- User's interests: ${interests.join(', ')}
- Location: ${location}
- Date: ${startDate}
- Additional notes: ${additionalNotes || 'None'}
- AI suggestions allowed: ${allowAISuggestions}

Extract event details, venue information, and timing from screenshots. Create a realistic schedule that:
1. Groups nearby activities
2. Accounts for typical travel time between locations
3. Balances activity types
4. Includes breaks and meal times
5. Respects typical venue hours

Return a JSON object with:
{
  "date": "YYYY-MM-DD",
  "summary": "Brief engaging summary of the day",
  "items": [
    {
      "id": "unique-id",
      "time": "HH:MM AM/PM",
      "title": "Activity name",
      "location": "Full address or location name",
      "description": "Detailed description",
      "category": "Art & Museums|Food & Dining|etc",
      "duration": "X hours|X mins",
      "weather": "Sunny, 22°C" (placeholder),
      "travelTime": "X mins" (if not first item)
    }
  ]
}`;

    // Prepare messages with screenshots
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Create an itinerary for ${location} on ${startDate}. Here are my screenshots of places/events I want to include:`
          },
          ...screenshots.map((screenshot: string) => ({
            type: 'image_url',
            image_url: { url: screenshot }
          }))
        ]
      }
    ];

    console.log('Calling Lovable AI for screenshot analysis...');

    // Call Lovable AI for screenshot analysis and itinerary generation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let itinerary;
    try {
      itinerary = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: create a basic structure
      itinerary = {
        date: startDate,
        summary: "Unable to fully process screenshots. Here's a basic itinerary based on your preferences.",
        items: []
      };
    }

    // Enhance with weather data if API key is available
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (OPENWEATHER_API_KEY) {
      try {
        console.log('Fetching weather data...');
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          const weatherDesc = `${weatherData.weather[0].main}, ${Math.round(weatherData.main.temp)}°C`;
          
          // Add weather to all items
          itinerary.items = itinerary.items.map((item: any) => ({
            ...item,
            weather: weatherDesc
          }));
          
          console.log('Weather data added:', weatherDesc);
        }
      } catch (weatherError) {
        console.error('Weather API error:', weatherError);
        // Continue without weather data
      }
    }

    // Generate images for each activity
    console.log('Generating images for activities...');
    const itemsWithImages = await Promise.all(
      itinerary.items.map(async (item: any) => {
        try {
          const imagePrompt = `A high-quality, vibrant travel photograph representing: ${item.title} at ${item.location}. ${item.description}. Style: professional travel photography, colorful, engaging, 16:9 aspect ratio.`;
          
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: imagePrompt
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            if (imageUrl) {
              console.log(`Image generated for: ${item.title}`);
              return { ...item, imageUrl };
            }
          }
          
          console.log(`Failed to generate image for: ${item.title}`);
          return item;
        } catch (imageError) {
          console.error(`Error generating image for ${item.title}:`, imageError);
          return item;
        }
      })
    );

    itinerary.items = itemsWithImages;
    console.log('Itinerary generation complete with images');

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-itinerary function:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error for other cases (don't leak internal details)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
