// api/identify-plant.js
// Vercel serverless function — proxies requests to Anthropic API.
// The ANTHROPIC_API_KEY environment variable is set in Vercel dashboard
// and never exposed to the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const prompt = `You are an expert horticulturalist and botanist. Analyse this plant photo and provide the following in JSON format only (no other text):

{
  "identified": true or false,
  "commonName": "most likely common name",
  "scientificName": "genus species",
  "confidence": "High / Medium / Low",
  "alternatives": [
    { "commonName": "...", "scientificName": "..." }
  ],
  "care": {
    "light": "e.g. Bright indirect light / Full shade / Direct sun",
    "watering": "brief watering guidance",
    "humidity": "preference",
    "temperature": "ideal range",
    "feeding": "brief feeding guidance",
    "notes": "any other key care points"
  },
  "displayTips": {
    "companions": ["plant 1", "plant 2", "plant 3"],
    "displayIdeas": "brief suggestion for mixed displays or groupings",
    "positioning": "best position in an interior setting"
  },
  "summary": "2-3 sentence overview of the plant and its suitability for interior use"
}

If the image does not clearly show a plant, or you cannot identify it, set "identified" to false and leave other fields as empty strings or empty arrays. Always return valid JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'Plant identification service unavailable' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'Could not parse identification result' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Plant ID error:', err);
    return res.status(500).json({ error: 'Identification failed. Please try again.' });
  }
}
