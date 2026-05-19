const axios = require('axios');
const { ANTHROPIC_API_KEY } = require('../config/env');

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Ask Claude to explain a planet in simple, engaging language for young audiences.
 * @param {Object} planetData - Raw planet data from NASA
 * @param {string} audienceLevel - 'child' | 'teen' | 'adult' (default: 'teen')
 */
const explainPlanet = async (planetData, audienceLevel = 'teen') => {
  if (!ANTHROPIC_API_KEY) {
    throw Object.assign(
      new Error('AI features are not configured. Set ANTHROPIC_API_KEY in your .env file.'),
      { status: 503 }
    );
  }

  const audiencePrompts = {
    child: 'a curious 8-year-old child who loves space cartoons',
    teen: 'a curious teenager who is interested in science',
    adult: 'an adult with general scientific literacy',
  };
  const audience = audiencePrompts[audienceLevel] || audiencePrompts.teen;

  const prompt = `You are an enthusiastic and friendly astronomer. Explain the following exoplanet to ${audience}.
Make it vivid, exciting, and educational. Use analogies to everyday things. Keep it under 200 words.

Planet data:
- Name: ${planetData.pl_name}
- Host star: ${planetData.hostname}
- Distance from Earth: ${planetData.sy_dist ? `${parseFloat(planetData.sy_dist).toFixed(1)} parsecs (~${(planetData.sy_dist * 3.26).toFixed(0)} light-years)` : 'unknown'}
- Planet radius: ${planetData.pl_rade ? `${planetData.pl_rade} Earth radii` : 'unknown'}
- Mass: ${planetData.pl_bmasse ? `${planetData.pl_bmasse} Earth masses` : 'unknown'}
- Orbital period: ${planetData.pl_orbper ? `${parseFloat(planetData.pl_orbper).toFixed(1)} days` : 'unknown'}
- Equilibrium temperature: ${planetData.pl_eqt ? `${planetData.pl_eqt} K` : 'unknown'}
- Discovery year: ${planetData.disc_year || 'unknown'}
- Discovery method: ${planetData.discoverymethod || 'unknown'}

Be imaginative: describe what it might look, feel, or smell like. Could it support life? Is it a gas giant or rocky? End with one thought-provoking question for the reader.`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    planet_name: planetData.pl_name,
    audience_level: audienceLevel,
    explanation: response.data.content?.[0]?.text || '',
  };
};

/**
 * Generate a fun "planet fact card" — a short curiosity fact for UI display.
 * @param {string} planetName
 * @param {Object} planetData
 */
const generateFactCard = async (planetName, planetData) => {
  if (!ANTHROPIC_API_KEY) {
    throw Object.assign(
      new Error('AI features are not configured. Set ANTHROPIC_API_KEY in your .env file.'),
      { status: 503 }
    );
  }

  const prompt = `Give me exactly 3 fascinating, short "Did you know?" facts about the exoplanet ${planetName}. 
Use the following data where relevant: ${JSON.stringify(planetData)}.
Format your response as a JSON array of strings, nothing else. Example: ["Fact one.", "Fact two.", "Fact three."]`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    }
  );

  const raw = response.data.content?.[0]?.text || '[]';
  const facts = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return { planet_name: planetName, facts };
};

module.exports = { explainPlanet, generateFactCard };
