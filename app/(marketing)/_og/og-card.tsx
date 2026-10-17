import { readFile } from 'fs/promises'
import path from 'path'
import { ImageResponse } from 'next/og'

// Social share card (Open Graph / X) in the marketing site's style:
// olive background, Instrument Serif headline, green accents.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const FONT_DIR = path.join(process.cwd(), 'app', '(marketing)', '_fonts')

const colors = {
  bg: '#f4f4f0',
  ink: '#151511',
  muted: '#5c5e52',
  green: '#3b6d11',
  lime: '#97c459',
  line: 'rgba(21, 21, 17, 0.1)',
}

async function fonts() {
  const [serif, serifItalic, sans, sansBold] = await Promise.all(
    ['InstrumentSerif-Regular.ttf', 'InstrumentSerif-Italic.ttf', 'Inter-Regular.ttf', 'Inter-SemiBold.ttf'].map(f =>
      readFile(path.join(FONT_DIR, f)),
    ),
  )
  return [
    { name: 'Instrument Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    { name: 'Instrument Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    { name: 'Inter', data: sans, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: sansBold, weight: 600 as const, style: 'normal' as const },
  ]
}

export async function ogCard({
  eyebrow,
  title,
  accent,
  footer,
}: {
  eyebrow: string
  title: string
  // Optional second part of the headline, set in green italics
  accent?: string
  footer?: string
}) {
  const long = title.length + (accent?.length ?? 0) > 60
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: colors.bg,
          fontFamily: 'Inter',
          position: 'relative',
        }}
      >
        {/* Soft green glow in the corner */}
        <div
          style={{
            position: 'absolute',
            right: -160,
            bottom: -220,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(151,196,89,0.35), rgba(151,196,89,0))',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 52, color: colors.ink, letterSpacing: -1 }}>keyone</div>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              fontWeight: 600,
              color: colors.green,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            // Long titles put the accent on its own line; short ones keep it inline
            flexDirection: long ? 'column' : 'row',
            flexWrap: long ? 'nowrap' : 'wrap',
            fontFamily: 'Instrument Serif',
            fontSize: long ? 68 : 88,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            color: colors.ink,
            maxWidth: 1000,
          }}
        >
          <span>{title}</span>
          {accent && (
            <span style={{ fontStyle: 'italic', color: colors.green, marginLeft: long ? 0 : 20 }}>{accent}</span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${colors.line}`,
            paddingTop: 28,
            fontSize: 24,
            color: colors.muted,
          }}
        >
          <div style={{ display: 'flex' }}>{footer ?? 'API keys and AI spend for agencies and freelancers, organized by client'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.ink, fontWeight: 600 }}>
            <div style={{ width: 14, height: 14, borderRadius: 9999, background: colors.lime }} />
            getkeyone.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

// Share card for a post with a thumbnail: the thumbnail fills the card, with the
// headline set in white on its left. Thumbnails leave their left side empty for it.
export async function ogCoverCard({ image, eyebrow, title, footer }: { image: string; eyebrow: string; title: string; footer?: string }) {
  const file = await readFile(path.join(process.cwd(), 'public', image))
  const mime = /\.png$/i.test(image) ? 'image/png' : 'image/jpeg'
  const long = title.length > 48
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#141311',
          color: '#fff',
          fontFamily: 'Inter',
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={`data:${mime};base64,${file.toString('base64')}`}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 52, letterSpacing: -1 }}>keyone</div>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              fontWeight: 600,
              color: colors.lime,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginTop: 8,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Instrument Serif',
            fontSize: long ? 56 : 68,
            lineHeight: 1.05,
            letterSpacing: -1,
            maxWidth: 380,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255, 255, 255, 0.6)' }}>
          {footer ?? 'getkeyone.com'}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}
