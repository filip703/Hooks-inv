// app/api/courses/route.js
// Proxy for golfcourseapi.com — keeps API key server-side

const BASE = 'https://api.golfcourseapi.com/v1'
const KEY = process.env.GOLF_COURSE_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  const q = searchParams.get('q')

  if (!KEY) {
    return Response.json({ error: 'GOLF_COURSE_API_KEY not set' }, { status: 500 })
  }

  try {
    let url
    if (action === 'search') {
      url = `${BASE}/search?search_query=${encodeURIComponent(q || '')}`
    } else if (action === 'course') {
      url = `${BASE}/courses/${id}`
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Key ${KEY}` }
    })

    if (!res.ok) {
      const text = await res.text()
      return Response.json({ error: `API error ${res.status}: ${text}` }, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
