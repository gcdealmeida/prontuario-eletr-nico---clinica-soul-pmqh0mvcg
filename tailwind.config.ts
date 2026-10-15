/* Tailwind config for the frontend react app. This is where the app theme should be defined: https://v2.tailwindcss.com/docs/configuration. */
import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import aspectRatioPlugin from '@tailwindcss/aspect-ratio'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function ensureOgBannerGenerated() {
  try {
    const bannerPath = path.resolve(process.cwd(), 'public/og-soul-pre-avaliacao-v2.png')
    const srcPath = path.resolve(process.cwd(), 'public/og-image.png')
    if (fs.existsSync(bannerPath) && fs.statSync(bannerPath).size > 100000) {
      return
    }
    if (!fs.existsSync(srcPath)) return

    const srcBuf = fs.readFileSync(srcPath)
    let offset = 8
    let srcW = 0,
      srcH = 0,
      colorType = 6
    const idatParts = []
    while (offset < srcBuf.length) {
      const len = srcBuf.readUInt32BE(offset)
      const type = srcBuf.toString('ascii', offset + 4, offset + 8)
      const data = srcBuf.subarray(offset + 8, offset + 8 + len)
      offset += 12 + len
      if (type === 'IHDR') {
        srcW = data.readUInt32BE(0)
        srcH = data.readUInt32BE(4)
        colorType = data[9]
      } else if (type === 'IDAT') {
        idatParts.push(data)
      } else if (type === 'IEND') break
    }

    const compressed = Buffer.concat(idatParts)
    const raw = zlib.inflateSync(compressed)
    const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 4
    const stride = srcW * bpp
    const srcRgba = Buffer.alloc(srcW * srcH * 4)

    function paeth(a, b, c) {
      const p = a + b - c
      const pa = Math.abs(p - a),
        pb = Math.abs(p - b),
        pc = Math.abs(p - c)
      return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
    }

    let rawOffset = 0
    const prevLine = Buffer.alloc(stride)
    const currLine = Buffer.alloc(stride)
    for (let y = 0; y < srcH; y++) {
      const filter = raw[rawOffset++]
      for (let x = 0; x < stride; x++) {
        const byte = raw[rawOffset++]
        const left = x >= bpp ? currLine[x - bpp] : 0
        const up = prevLine[x]
        const upLeft = x >= bpp ? prevLine[x - bpp] : 0
        let val = byte
        if (filter === 1) val = (byte + left) & 0xff
        else if (filter === 2) val = (byte + up) & 0xff
        else if (filter === 3) val = (byte + Math.floor((left + up) / 2)) & 0xff
        else if (filter === 4) val = (byte + paeth(left, up, upLeft)) & 0xff
        currLine[x] = val
      }
      currLine.copy(prevLine)
      for (let x = 0; x < srcW; x++) {
        const sIdx = x * bpp
        const dIdx = (y * srcW + x) * 4
        srcRgba[dIdx] = currLine[sIdx]
        srcRgba[dIdx + 1] = currLine[sIdx + 1]
        srcRgba[dIdx + 2] = currLine[sIdx + 2]
        srcRgba[dIdx + 3] = bpp === 4 ? currLine[sIdx + 3] : 255
      }
    }

    const dstW = 1200,
      dstH = 630
    const dstRgba = Buffer.alloc(dstW * dstH * 4)

    const topBar = 10
    const usableH = dstH - topBar
    for (let dy = topBar; dy < dstH; dy++) {
      const sy = ((dy - topBar) / (usableH - 1)) * (srcH - 1)
      const y0 = Math.floor(sy),
        y1 = Math.min(y0 + 1, srcH - 1),
        fy = sy - y0
      for (let dx = 0; dx < dstW; dx++) {
        const sx = (dx / (dstW - 1)) * (srcW - 1)
        const x0 = Math.floor(sx),
          x1 = Math.min(x0 + 1, srcW - 1),
          fx = sx - x0
        const i00 = (y0 * srcW + x0) * 4,
          i10 = (y0 * srcW + x1) * 4
        const i01 = (y1 * srcW + x0) * 4,
          i11 = (y1 * srcW + x1) * 4
        const dIdx = (dy * dstW + dx) * 4
        for (let c = 0; c < 3; c++) {
          const top = srcRgba[i00 + c] * (1 - fx) + srcRgba[i10 + c] * fx
          const bottom = srcRgba[i01 + c] * (1 - fx) + srcRgba[i11 + c] * fx
          dstRgba[dIdx + c] = Math.round(top * (1 - fy) + bottom * fy)
        }
        dstRgba[dIdx + 3] = 255
      }
    }

    for (let y = 0; y < topBar; y++) {
      for (let x = 0; x < dstW; x++) {
        const t = x / (dstW - 1)
        let r, g, b
        if (t < 0.25) {
          const s = t / 0.25
          r = Math.round(140 + (175 - 140) * s)
          g = Math.round(101 + (131 - 101) * s)
          b = Math.round(39 + (73 - 39) * s)
        } else if (t < 0.5) {
          const s = (t - 0.25) / 0.25
          r = Math.round(175 + (223 - 175) * s)
          g = Math.round(131 + (191 - 131) * s)
          b = Math.round(73 + (142 - 73) * s)
        } else if (t < 0.75) {
          const s = (t - 0.5) / 0.25
          r = Math.round(223 + (175 - 223) * s)
          g = Math.round(191 + (131 - 191) * s)
          b = Math.round(142 + (73 - 142) * s)
        } else {
          const s = (t - 0.75) / 0.25
          r = Math.round(175 + (140 - 175) * s)
          g = Math.round(131 + (101 - 131) * s)
          b = Math.round(73 + (39 - 73) * s)
        }
        const dIdx = (y * dstW + x) * 4
        dstRgba[dIdx] = r
        dstRgba[dIdx + 1] = g
        dstRgba[dIdx + 2] = b
        dstRgba[dIdx + 3] = 255
      }
    }

    function makeChunk(t, d) {
      const tb = Buffer.from(t, 'ascii'),
        lb = Buffer.alloc(4)
      lb.writeUInt32BE(d.length, 0)
      const crc = zlib.crc32(Buffer.concat([tb, d]))
      const cb = Buffer.alloc(4)
      cb.writeUInt32BE(crc >>> 0, 0)
      return Buffer.concat([lb, tb, d, cb])
    }

    const magic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(dstW, 0)
    ihdr.writeUInt32BE(dstH, 4)
    ihdr[8] = 8
    ihdr[9] = 6
    const IHDR = makeChunk('IHDR', ihdr)
    const rawStride = dstW * 4
    const rawDst = Buffer.alloc(dstH * (rawStride + 1))
    let rIdx = 0
    for (let y = 0; y < dstH; y++) {
      rawDst[rIdx++] = 0
      const ls = y * rawStride
      dstRgba.copy(rawDst, rIdx, ls, ls + rawStride)
      rIdx += rawStride
    }
    const IDAT = makeChunk('IDAT', zlib.deflateSync(rawDst, { level: 9 }))
    const IEND = makeChunk('IEND', Buffer.alloc(0))
    const outPng = Buffer.concat([magic, IHDR, IDAT, IEND])
    fs.writeFileSync(bannerPath, outPng)
  } catch (err) {
    console.error('ensureOgBannerGenerated error:', err)
  }
}

ensureOgBannerGenerated()

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Inter var', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        soul: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        soul: {
          gold: '#C9A46A',
          'gold-light': '#E3C89A',
          'gold-dark': '#A37E43',
          champagne: '#F0E3CC',
          'champagne-light': '#FAF4EA',
          brown: '#5C4033',
          'brown-dark': '#4A322A',
          'brown-deep': '#33221C',
          copper: '#B87355',
          'copper-light': '#D6957B',
          cream: '#FAF7F1',
          linen: '#F4EFE6',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionProperty: {
        width: 'width',
        height: 'height',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        elevation: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin, aspectRatioPlugin],
} satisfies Config
