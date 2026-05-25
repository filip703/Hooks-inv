// Klient-sides bildkomprimering — krymper foton innan upload till Supabase storage.
// Sparar egress + lagring. Bevarar video, GIF och dokument oförändrade.
export async function compressImage(file, maxDim = 1600, quality = 0.82) {
  if (!file || !file.type) return file
  if (!file.type.startsWith('image/')) return file        // video/dokument passerar
  if (file.type === 'image/gif') return file              // bevara animation
  try {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = dataUrl
    })
    const { width, height } = img
    // Redan liten? Hoppa över.
    if (width <= maxDim && height <= maxDim && file.size < 500 * 1024) return file
    const scale = Math.min(1, maxDim / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file       // ingen vinst — behåll original
    const newName = file.name.replace(/\.(png|webp|heic|heif|jpeg|jpg)$/i, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (e) {
    console.warn('Bildkomprimering misslyckades, använder original:', e)
    return file
  }
}
