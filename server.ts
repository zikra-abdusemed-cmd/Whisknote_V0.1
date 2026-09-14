import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini SDK lazily
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WhiskNote API' });
});

// Fallback baker logic if AI key is missing or external call fails
function getBakingSuggestionsFallback(title: string, category: string, ingredients: string[]) {
  const ingLower = ingredients.map(i => i.toLowerCase()).join(' ');
  const titleLower = (title || '').toLowerCase();
  const suggestions: Array<{ name: string; amount: string; unit: string; reason: string }> = [];

  const addIfMissing = (name: string, amount: string, unit: string, reason: string) => {
    if (!ingLower.includes(name.toLowerCase().split(' ')[0])) {
      suggestions.push({ name, amount, unit, reason });
    }
  };

  // Check common baking complements
  if (!ingLower.includes('salt')) {
    addIfMissing('Fine Sea Salt', '1/2', 'tsp', 'Crucial to balance sweetness and heighten aromas');
  }
  if (!ingLower.includes('vanilla')) {
    addIfMissing('Pure Vanilla Extract', '1', 'tsp', 'Adds warm, cozy aromatic depth');
  }
  if (category === 'Cookies' || titleLower.includes('cookie')) {
    if (!ingLower.includes('baking soda')) {
      addIfMissing('Baking Soda', '1/2', 'tsp', 'Encourages spread and golden browning');
    }
    if (!ingLower.includes('chocolate') && !ingLower.includes('chunk')) {
      addIfMissing('Semisweet Chocolate Chunks', '1', 'cup', 'Rich pockets of melted chocolate');
    }
    if (!ingLower.includes('cornstarch')) {
      addIfMissing('Cornstarch', '1', 'tsp', 'Keeps the cookie centers extra tender and soft');
    }
  } else if (category === 'Cakes' || titleLower.includes('cake')) {
    if (!ingLower.includes('baking powder')) {
      addIfMissing('Baking Powder', '1 1/2', 'tsp', 'Essential for a light, airy crumb');
    }
    if (!ingLower.includes('buttermilk') && !ingLower.includes('milk')) {
      addIfMissing('Buttermilk', '1/2', 'cup', 'Tenderizes crumb with gentle acidity');
    }
    if (!ingLower.includes('lemon') && !ingLower.includes('zest')) {
      addIfMissing('Fresh Lemon Zest', '1', 'tsp', 'Brightens sweetness with citrus oils');
    }
  } else if (category === 'Bread' || titleLower.includes('bread') || titleLower.includes('brioche')) {
    if (!ingLower.includes('yeast')) {
      addIfMissing('Instant Dry Yeast', '2 1/4', 'tsp', 'Provides dependable rise and aroma');
    }
    if (!ingLower.includes('honey') && !ingLower.includes('sugar')) {
      addIfMissing('Raw Honey', '1', 'tbsp', 'Feeds yeast and imparts a soft golden crust');
    }
    if (!ingLower.includes('butter') && !ingLower.includes('olive oil')) {
      addIfMissing('Unsalted European Butter', '2', 'tbsp', 'Enriches gluten structure and softness');
    }
  } else {
    if (!ingLower.includes('cinnamon')) {
      addIfMissing('Ground Ceylon Cinnamon', '1/2', 'tsp', 'Gentle warm spice accent');
    }
    if (!ingLower.includes('powder')) {
      addIfMissing('Baking Powder', '1', 'tsp', 'Adds lift and light texture');
    }
  }

  return {
    suggestions: suggestions.slice(0, 5),
    bakerTip: 'Baker\'s secret: Room-temperature eggs and dairy emulsify much smoother into batters!',
  };
}

// AI Endpoint: Suggest Ingredients
app.post('/api/ai/suggest-ingredients', async (req, res) => {
  const { recipeTitle, category, currentIngredients } = req.body;
  const ingredientsList: string[] = Array.isArray(currentIngredients) ? currentIngredients : [];

  const ai = getGeminiClient();

  if (!ai) {
    const fallback = getBakingSuggestionsFallback(recipeTitle || '', category || '', ingredientsList);
    return res.json({
      success: true,
      source: 'curated_baker',
      suggestions: fallback.suggestions,
      bakerTip: fallback.bakerTip,
    });
  }

  try {
    const prompt = `You are WhiskNote's expert home baking companion.
A home baker is drafting a recipe:
Title: "${recipeTitle || 'Untitled Bake'}"
Category: "${category || 'Baking'}"
Current ingredients entered: ${ingredientsList.length > 0 ? ingredientsList.join(', ') : 'None yet'}

Suggest 3 to 5 complementary baking ingredients, leaveners, spices, extracts, or flavor pairings that would elevate this specific bake.
For each suggestion, provide:
- name: Clear ingredient name (e.g. "Pure Vanilla Extract", "Baking Powder", "Flaky Sea Salt")
- amount: Recommended quantity as a string (e.g. "1", "1/2", "2")
- unit: Standard baking unit (e.g. "tsp", "tbsp", "cup", "g", "pinch")
- reason: A concise, warm 1-sentence note on why this ingredient improves the bake.

Also provide one practical "bakerTip" for making this recipe succeed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['name', 'amount', 'unit', 'reason'],
              },
            },
            bakerTip: {
              type: Type.STRING,
            },
          },
          required: ['suggestions', 'bakerTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      source: 'gemini',
      suggestions: parsed.suggestions || [],
      bakerTip: parsed.bakerTip || 'Remember to measure flour with a spoon and level method or scale for best texture!',
    });
  } catch (error) {
    console.error('Error in Gemini ingredient suggestion:', error);
    const fallback = getBakingSuggestionsFallback(recipeTitle || '', category || '', ingredientsList);
    return res.json({
      success: true,
      source: 'fallback',
      suggestions: fallback.suggestions,
      bakerTip: fallback.bakerTip,
    });
  }
});

// AI Endpoint: Quick Baking Assistant Q&A
app.post('/api/ai/baking-assistant', async (req, res) => {
  const { question, recipeContext } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      answer: "Baking Tip: Keep an eye on visual cues like golden crust and gentle springiness rather than clock time alone, as home oven temperatures can vary!",
    });
  }

  try {
    const prompt = `You are WhiskNote's friendly, encouraging master baker answering a home baker's question.
Recipe Context: ${recipeContext || 'General Baking'}
Question: "${question}"

Provide a concise, practical, comforting answer (2-4 sentences max) with actionable advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm, knowledgeable artisan pastry chef and home baker mentor.',
      },
    });

    return res.json({
      answer: response.text?.trim() || 'Happy baking! Trust the process and bake until golden.',
    });
  } catch (error) {
    console.error('Error in baking assistant:', error);
    return res.json({
      answer: 'Baking is both science and intuition: when in doubt, check doneness with a toothpick or instant-read probe thermometer (200°F/93°C for bread)!',
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhiskNote server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
