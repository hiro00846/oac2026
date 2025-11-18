'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export const useMenu = () => {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider')
  }
  return context
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MenuContext.Provider>
  )
}

// ホームアイコン
const HomeIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

// ビデオアイコン
const VideoIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
)

// 画像クロップアイコン
const CropIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={isActive ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12m0 0l4 4m0-4l-4 4"
    />
  </svg>
)

// メニューアイコン
const MenuIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
)

export default function NavigationMenu() {
  const { isOpen, setIsOpen } = useMenu()
  const pathname = usePathname()

  const menuItems = [
    { href: '/', label: 'ホーム', icon: HomeIcon },
    { href: '/video-snap', label: 'Video Snapshot', icon: VideoIcon },
    { href: '/image-crop', label: '画像クロップ', icon: CropIcon },
  ]

  return (
    <nav
      className={`bg-white dark:bg-[#212121] text-black dark:text-white transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-16'
      } flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-gray-700`}
    >
      {/* メニューボタン */}
      <div className="px-4 py-3 flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        >
          <MenuIcon />
        </button>
      </div>

      {/* メニュー項目 */}
      <ul className="flex-1 px-2 py-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <IconComponent isActive={isActive} />
                {isOpen && (
                  <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

