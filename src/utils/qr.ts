// Las etiquetas de las muestras llevan un QR con el texto "ATLASRAM:ISOLATE:<id>".
// También aceptamos un enlace atlasram://isolates/<id> o solo el número.
const PATTERNS = [/^ATLASRAM:ISOLATE:(\d+)$/i, /^atlasram:\/\/isolates\/(\d+)$/i, /^(\d+)$/]

export function parseIsolateQr(raw: string): number | null {
  const text = raw.trim()
  for (const pattern of PATTERNS) {
    const match = text.match(pattern)
    if (match) return Number(match[1])
  }
  return null
}
