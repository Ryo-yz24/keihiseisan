'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PasswordGuardProps {
  children: React.ReactNode
}

export function PasswordGuard({ children }: PasswordGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // セッションストレージからパスワードを確認
    const storedPassword = sessionStorage.getItem('access_password')
    
    
    if (storedPassword === 'keihiseisan2024') {
      setIsAuthenticated(true)
    } else {
      // パスワードが正しくない場合は認証ページにリダイレクト
      if (window.location.pathname !== '/password-check') {
        window.location.href = '/password-check'
      }
    }
    
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
