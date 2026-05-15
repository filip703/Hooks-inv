import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const body = await req.json()
    // Stöd båda formaten: { prompt } och { message, holeData, playerHcp, roundContext }
    const prompt = body.prompt || body.message
    if (!prompt) return NextResponse.json({ text: 'Ingen fråga skickades.', reply: 'Ingen fråga skickades.' })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY saknas i Vercel env')
      return NextResponse.json({ text: 'Caddie AI ej konfigurerad (API-nyckel saknas)', reply: 'Caddie AI ej konfigurerad.' })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Anthropic API fel:', res.status, err)
      return NextResponse.json({
        text: `Caddien är offline (${res.status}). Lita på magkänslan.`,
        reply: `Caddien är offline (${res.status}).`
      })
    }

    const data = await res.json()
    const text = data.content?.find(c => c.type === 'text')?.text || 'Caddien tänker...'
    return NextResponse.json({ text, reply: text })

  } catch (e) {
    console.error('Caddie API exception:', e)
    return NextResponse.json({ text: 'Caddien tappade signalen! Lita på magkänslan.', reply: 'Caddien tappade signalen.' })
  }
}
