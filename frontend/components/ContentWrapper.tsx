'use client'

import { useMenu } from '@/components/NavigationMenu'

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useMenu()
  
  return (
    <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'ml-64' : 'ml-16'}`}>
      {children}
    </div>
  )
}


