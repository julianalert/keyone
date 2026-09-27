import { readFile } from 'fs/promises'
import path from 'path'
import { ImageResponse } from 'next/og'

// Favicon: the keyone "k" in Instrument Serif on the brand's near-black.
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const serif = await readFile(path.join(process.cwd(), 'app', '(marketing)', '_fonts', 'InstrumentSerif-Regular.ttf'))
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#151511',
          borderRadius: 7,
          color: '#97c459',
          fontFamily: 'Instrument Serif',
          fontSize: 30,
          paddingBottom: 4,
        }}
      >
        k
      </div>
    ),
    { ...size, fonts: [{ name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' }] },
  )
}
