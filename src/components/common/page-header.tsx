'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-1"
          >
            <Home className="h-4 w-4" />
            <span>ホーム</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
