'use client'

import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  
  const getHeaderText = () => {
    if (pathname === '/') {
      return {
        line1: 'Welcome to',
        line2: 'DK Collections',
      }
    }
    
    const pageName = pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
    
    return {
      line1: pageName || '',
      line2: null,
    }
  }
  
  const { line1, line2 } = getHeaderText()
  
  return (
    <header className="relative w-full">

      
      <div className="bg-[#D32F2F] py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          {line2 ? (
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                {line1}
              </h1>
              <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                {line2}
              </h1>
            </div>
          ) : (
            <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
              {line1}
            </h1>
          )}
        </div>
      </div>
    </header>
  )
}

