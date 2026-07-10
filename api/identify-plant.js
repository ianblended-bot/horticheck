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

  const { imageBase64, mediaType, quickMode } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const quickPrompt = `You are an expert botanist. Identify the plant in this photo.

Respond with valid JSON only — no explanation, no markdown, no text before or after the JSON:

{
  "identified": true,
  "commonName": "Peace Lily",
  "scientificName": "Spathiphyllum wallisii",
  "confidence": "High",
  "alternatives": [
    { "commonName": "Example alternative", "scientificName": "Genus species" }
  ]
}

If you cannot identify a plant in the image, respond with:
{ "identified": false, "commonName": "", "scientificName": "", "confidence": "Low", "alternatives": [] }

Always return valid JSON. Do not include care or display information.`;

  const fullPrompt = `You are an expert horticulturalist and botanist. Analyse this plant photo and provide the following in JSON format only (no other text, no markdown):

{
  "identified": true,
  "commonName": "Peace Lily",
  "scientificName": "Spathiphyllum wallisii",
  "confidence": "High",
  "alternatives": [
    { "commonName": "Example", "scientificName": "Genus species" }
  ],
  "care": {
    "light": "Bright indirect light",
    "watering": "Water when top inch of soil is dry",
    "humidity": "High humidity preferred",
    "temperature": "18-27°C",
    "feeding": "Monthly during growing season",
    "notes": "Any other key care points"
  },
  "displayTips": {
    "companions": ["Plant 1", "Plant 2", "Plant 3"],
    "displayIdeas": "Brief suggestion for mixed displays or groupings",
    "positioning": "Best position in an interior setting"
  },
  "summary": "2-3 sentence overview of the plant and its suitability for interior use."
}

If the image does not clearly show a plant, or you cannot identify it, set "identified" to false and leave other fields as empty strings or empty arrays. Always return valid JSON with no text outside the JSON object.`;

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
        max_tokens: quickMode ? 512 : 1024,
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
                text: quickMode ? quickPrompt : fullPrompt,
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

    // Extract JSON — strip any markdown fences or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in response:', text);
      return res.status(502).json({ error: 'Could not parse identification result' });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Normalise quick mode result to have empty care/displayTips
    // so the app doesn't crash trying to read missing fields
    if (quickMode) {
      result.care = result.care || {};
      result.displayTips = result.displayTips || {};
      result.summary = result.summary || '';
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Plant ID error:', err);
    return res.status(500).json({ error: 'Identification failed. Please try again.' });
  }
}
