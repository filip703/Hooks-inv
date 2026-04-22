import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { prompt } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ text: 'Caddie AI ej konfigurerad (API-nyckel saknas)' })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.find(c => c.type === 'text')?.text || 'Caddien tänker...'
    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ text: 'Caddien tappade signalen! Lita på magkänslan.' })
  }
}
