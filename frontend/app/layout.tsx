import type { Metadata } from 'next'
import './globals.css'
import { MenuProvider } from '@/components/NavigationMenu'
import NavigationMenu from '@/components/NavigationMenu'
import ContentWrapper from '@/components/ContentWrapper'

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
      <body>
        <MenuProvider>
          <NavigationMenu />
          <ContentWrapper>{children}</ContentWrapper>
        </MenuProvider>
      </body>
    </html>
  )
}

