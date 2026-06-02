// app/api/courses/route.js
// Golf course data — search via Claude AI (Swedish courses), proxy golfcourseapi.com for others

const BASE = 'https://api.golfcourseapi.com/v1'
const GCA_KEY = process.env.GOLF_COURSE_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  const q = searchParams.get('q')

  try {
    // ── AI lookup: fråga Claude om bandata (Svenska banor) ──────────────────
    if (action === 'lookup') {
      if (!ANTHROPIC_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY saknas' }, { status: 500 })

      const prompt = `Du är en expert på svenska golfbanor. Returnera ENBART giltig JSON, ingen annan text.

Ge mig data för golfbanan: "${q}"

JSON-format:
{
  "club_name": "Banans officiella namn",
  "location": "Stad, Sverige",
  "tees": [
    {
      "tee_name": "Gul",
      "slope_rating": 130,
      "course_rating": 71.2,
      "holes": [
        { "hole": 1, "par": 4, "handicap": 7, "length_meters": 350 },
        ... (alla 18 hål)
      ]
    },
    {
      "tee_name": "Vit",
      "slope_rating": 125,
      "course_rating": 69.5,
      "holes": [ ... ]
    }
  ],
  "confidence": "high|medium|low"
}

Regler:
- handicap = HCP-index för hålet (1 = svårast, 18 = lättast)
- Inkludera Gul och Vit tee om möjligt
- Om du inte känner till banan, sätt confidence: "low" och gissa rimliga värden
- Svara ENBART med JSON, inga kommentarer`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!res.ok) return Response.json({ error: `AI error ${res.status}` }, { status: res.status })
      const data = await res.json()
      const text = data.content?.find(c => c.type === 'text')?.text || ''

      try {
        const clean = text.replace(/```json|```/g, '').trim()
        const course = JSON.parse(clean)
        return Response.json({ course })
      } catch {
        return Response.json({ error: 'Kunde inte tolka AI-svaret', raw: text }, { status: 500 })
      }
    }

    // ── Sök via golfcourseapi.com (internationella banor) ──────────────────
    if (!GCA_KEY) return Response.json({ error: 'GOLF_COURSE_API_KEY saknas' }, { status: 500 })

    if (action === 'search') {
      const res = await fetch(`${BASE}/search?search_query=${encodeURIComponent(q || '')}`, {
        headers: { 'Authorization': `Key ${GCA_KEY}` }
      })
      if (!res.ok) return Response.json({ error: `API error ${res.status}` }, { status: res.status })
      const data = await res.json()
      return Response.json(data)
    }

    if (action === 'course') {
      const res = await fetch(`${BASE}/courses/${id}`, {
        headers: { 'Authorization': `Key ${GCA_KEY}` }
      })
      if (!res.ok) return Response.json({ error: `API error ${res.status}` }, { status: res.status })
      const data = await res.json()
      return Response.json(data)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
