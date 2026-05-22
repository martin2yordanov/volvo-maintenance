export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { make, model, year } = req.body || {}
  if (!make || !model || !year) {
    return res.status(400).json({ error: 'make, model and year are required' })
  }

  const categories = [
    'Двигател', 'Охлаждане', 'Трансмисия', 'Спирачна система',
    'Окачване', 'Филтри и течности', 'Електрика', 'Гуми и колела',
  ]

  const prompt = `You are an expert automotive mechanic. Generate a maintenance schedule for a ${year} ${make} ${model}.

Return ONLY a raw JSON array — no markdown, no code fences, no explanation.

Each item must follow this exact schema:
{
  "id": <sequential integer starting at 1>,
  "importance": <integer 1-10>,
  "cat": <one of: ${categories.map(c => `"${c}"`).join(', ')}>,
  "name": <Bulgarian string — short name of the maintenance task>,
  "note": <Bulgarian string — specific tips, part numbers, known failure points for THIS exact car>,
  "intervalKm": <integer km interval or null>,
  "intervalYr": <number of years interval or null>,
  "lastDate": null,
  "lastKm": null,
  "replaced": false
}

Rules:
- Generate 15 to 20 items
- Sort by importance descending
- All "name" and "note" values must be in Bulgarian
- Include model-specific known failure points and weaknesses in the "note" field
- At least one item must have intervalKm and at least one must have intervalYr
- Do not include any item outside the provided "cat" values
- Output nothing except the JSON array`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq error:', err)
      return res.status(502).json({ error: 'AI service error' })
    }

    const groqData = await groqRes.json()
    const text = groqData.choices?.[0]?.message?.content || ''

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let items
    try {
      items = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse failed:', cleaned.slice(0, 200))
      return res.status(502).json({ error: 'Invalid response from AI' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(502).json({ error: 'Empty response from AI' })
    }

    return res.status(200).json({ items })
  } catch (err) {
    console.error('generate error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
