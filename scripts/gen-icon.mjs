// Generates assets/icon.png (1024x1024) with no dependencies — a dark CRT tile
// with a green prompt chevron + cursor, matching the ecosystem look. Run this,
// then `npx tauri icon assets/icon.png` rasterizes every platform variant.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const S = 1024
const px = Buffer.alloc(S * S * 4)

const set = (x, y, [r, g, b, a = 255]) => {
  if (x < 0 || y < 0 || x >= S || y >= S) return
  const i = (y * S + x) * 4
  px[i] = r
  px[i + 1] = g
  px[i + 2] = b
  px[i + 3] = a
}
const rect = (x0, y0, x1, y1, c) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c)
}
// thick line via stamped squares (Bresenham-ish sampling)
const line = (x0, y0, x1, y1, w, c) => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const cx = Math.round(x0 + (x1 - x0) * t)
    const cy = Math.round(y0 + (y1 - y0) * t)
    rect(cx - w, cy - w, cx + w, cy + w, c)
  }
}

const BG = [11, 15, 18, 255]
const SCREEN = [14, 22, 26, 255]
const GREEN = [57, 255, 137, 255]

rect(0, 0, S, S, BG)
// inner screen
rect(110, 150, S - 110, S - 150, SCREEN)
// green frame
const f = 36
rect(110, 150, S - 110, 150 + f, GREEN)
rect(110, S - 150 - f, S - 110, S - 150, GREEN)
rect(110, 150, 110 + f, S - 150, GREEN)
rect(S - 110 - f, 150, S - 110, S - 150, GREEN)
// prompt chevron ">"
const cw = 30
line(330, 380, 520, 512, cw, GREEN)
line(520, 512, 330, 644, cw, GREEN)
// cursor underscore
rect(560, 600, 720, 644, GREEN)

// --- PNG encode ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(S, 0)
ihdr.writeUInt32BE(S, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
// raw scanlines with filter byte 0 per row
const raw = Buffer.alloc(S * (S * 4 + 1))
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0
  px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4)
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
])

mkdirSync('assets', { recursive: true })
writeFileSync('assets/icon.png', png)
console.log('wrote assets/icon.png (%d bytes)', png.length)
