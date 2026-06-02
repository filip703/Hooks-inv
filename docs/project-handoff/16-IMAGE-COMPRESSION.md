# Image Compression

> Hur bilduppladdningar hanteras + bulk-komprimerings-workflow.

---

## Övergripande

Alla bilder som laddas upp till `inv-images`-bucketen komprimeras **före** uppladdning. Detta gäller:

- Chat-bilder (DIO + Täby)
- Banbild-uppladdning (Täby)
- Historia-bilder (DIO multi-upload)
- Profilbilder

**Resultat:** Filer typ 10-20× mindre. 132 MB sparat vid bulk-komprimering av 53 gamla bilder.

---

## Implementation

### `lib/imageCompress.js`

**Pseudokod:**
```js
export async function compressImage(file, options = {}) {
  const { maxDim = 1600, quality = 0.82 } = options
  
  // Skapa canvas
  const img = await loadImage(file)
  const { width, height } = scaleToFit(img.width, img.height, maxDim)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  // Bevara EXIF-orientation om möjligt
  applyExifOrientation(ctx, img, width, height)
  
  // Rita
  ctx.drawImage(img, 0, 0, width, height)
  
  // Exportera som JPEG
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}
```

### Anrop i upload-handlers

**Chat-upload:**
```js
const handleChatImage = async (file) => {
  const compressed = await compressImage(file, { maxDim: 1600, quality: 0.82 })
  const path = `taby-chat/${Date.now()}.jpg`
  await supabase.storage.from('inv-images').upload(path, compressed)
  // ...
}
```

**Banbild:**
```js
const handleHoleImageUpload = async (hole, file) => {
  const compressed = await compressImage(file, { maxDim: 1600, quality: 0.82 })
  const path = `taby/holes/hole-${hole}.webp`  // Note: behåller .webp-ext för konsekvens
  await supabase.storage.from('inv-images').upload(path, compressed, { upsert: true })
}
```

---

## Bulk-komprimering av gamla bilder

**Problem:** 53 gamla foton i `inv-images` var okomprimerade (totalt ~747 MB).

**Approach:**
1. Lista alla bilder i bucketet
2. Ladda ner var och en
3. Komprimera lokalt med `sips` (macOS) eller `magick` (ImageMagick)
4. Ladda upp tillbaka med samma path (kräver UPDATE-policy)

**Steg-för-steg:**

### 1. Lägg till tillfällig UPDATE-policy

```sql
CREATE POLICY temp_compress_update ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'inv-images')
  WITH CHECK (bucket_id = 'inv-images');
```

### 2. Lista bilder

```sql
SELECT name, metadata->>'size' AS size_bytes
FROM storage.objects
WHERE bucket_id = 'inv-images'
  AND name LIKE 'historia/%'
ORDER BY (metadata->>'size')::int DESC
LIMIT 100;
```

### 3. Ladda ner + komprimera lokalt

```bash
ANON=$(grep ANON_KEY /Users/filiphector/Hooks-inv/.env.local | cut -d= -f2)
BUCKET="https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images"

# För varje fil:
curl -s "$BUCKET/historia/$NAME" -o /tmp/img.jpg
sips -Z 1600 -s format jpeg -s formatOptions 82 /tmp/img.jpg --out /tmp/img-compressed.jpg
```

### 4. Ladda upp tillbaka

```bash
curl -X PUT "$BUCKET/historia/$NAME" \
  -H "Authorization: Bearer $ANON" \
  -H "Content-Type: image/jpeg" \
  -H "x-upsert: true" \
  --data-binary "@/tmp/img-compressed.jpg"
```

### 5. Ta bort policy DIREKT när färdig

```sql
DROP POLICY temp_compress_update ON storage.objects;
```

**Säkerhet:** Lämna ALDRIG temp_update-policyn aktiv. Anon ska inte kunna ändra storage.

---

## Verifiera komprimering

```sql
-- Lista storlek per bild
SELECT name, ROUND((metadata->>'size')::int / 1024.0, 1) AS size_kb
FROM storage.objects
WHERE bucket_id = 'inv-images'
ORDER BY (metadata->>'size')::int DESC
LIMIT 20;
```

Komprimerade bilder ska vara ≤ ~500 KB. Okomprimerade kan vara 5-15 MB.

---

## Edge cases

### EXIF-rotation
iPhone-bilder har ofta EXIF-orientation som behöver tillämpas på canvas innan exporten. Annars blir bilden roterad i webbläsaren.

Lösning: läs EXIF, applicera rotation/flip på canvas-context innan `drawImage`.

### Genomskinliga PNG
Vid konvertering till JPEG förlorar du alpha. För profilbilder med transparent bakgrund: använd PNG istället (lägg till option `format: 'png'`).

### För små bilder
Om originalet är 200×200px räcker det. Skala inte upp.

```js
const scale = Math.min(maxDim / Math.max(img.width, img.height), 1)
```

### HEIC (iPhone)
Safari kan läsa HEIC och canvas funkar. Andra webbläsare måste eventuellt konvertera först.

---

## Kvalitets-vs-storlek-trade-off

| Kvalitet | Filstorlek | Use case |
|---|---|---|
| 0.95 | Stor (~70% av original) | Inte rekommenderat |
| 0.85 | Måttlig | För profilbilder kanske |
| **0.82** | **Liten + skarp** | **Default (chat, historia, banguide)** |
| 0.75 | Mycket liten | Om bandbredd är problem |
| 0.65 | Suddig | Inte rekommenderat |

`0.82` ger 10-20× mindre filer än original med försumbar visuell kvalitetsförlust.

---

## Framtida förbättringar

- [ ] Stöd för WebP-output (ännu mindre filer)
- [ ] Progressiv JPEG (laddas in succesivt)
- [ ] AVIF-stöd för moderna webbläsare
- [ ] Server-side komprimering som fallback (om klient-canvas failar)
- [ ] Auto-rotering baserat på EXIF
- [ ] Thumbnail-generation (för listor)
