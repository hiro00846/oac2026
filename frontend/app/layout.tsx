import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Snapshot App',
  description: '動画から静止画を切り出すアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

