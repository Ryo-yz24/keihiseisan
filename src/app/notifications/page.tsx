'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Bell, Mail, AlertCircle, CheckCircle, Home } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface NotificationSettings {
  expenseApproval: boolean
  expenseRejection: boolean
  limitExceeded: boolean
  exemptionApproval: boolean
  exemptionRejection: boolean
  systemAnnouncements: boolean
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [settings, setSettings] = useState<NotificationSettings>({
    expenseApproval: true,
    expenseRejection: true,
    limitExceeded: true,
    exemptionApproval: true,
    exemptionRejection: true,
    systemAnnouncements: true,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '通知設定を保存しました' })
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const notificationOptions = [
    {
      key: 'expenseApproval' as keyof NotificationSettings,
      title: '経費承認通知',
      description: '経費が承認されたときに通知を受け取る'
    },
    {
      key: 'expenseRejection' as keyof NotificationSettings,
      title: '経費却下通知',
      description: '経費が却下されたときに通知を受け取る'
    },
    {
      key: 'limitExceeded' as keyof NotificationSettings,
      title: '限度額超過アラート',
      description: '月次限度額を超過したときに通知を受け取る'
    },
    {
      key: 'exemptionApproval' as keyof NotificationSettings,
      title: '上限解放承認通知',
      description: '上限解放申請が承認されたときに通知を受け取る'
    },
    {
      key: 'exemptionRejection' as keyof NotificationSettings,
      title: '上限解放却下通知',
      description: '上限解放申請が却下されたときに通知を受け取る'
    },
    {
      key: 'systemAnnouncements' as keyof NotificationSettings,
      title: 'システムお知らせ',
      description: 'システムからの重要なお知らせを受け取る'
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Bell className="mr-3 h-8 w-8" />
            通知設定
          </h1>
          <p className="text-gray-600 mt-2">通知の受信設定を管理します</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            メール通知設定
          </CardTitle>
          <CardDescription>
            各種イベントに対する通知の受信設定を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {message && (
              <div className={`p-4 rounded-md flex items-center ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message.text}
              </div>
            )}

            {notificationOptions.map((option) => (
              <div key={option.key} className="flex items-start justify-between py-4 border-b last:border-b-0">
                <div className="flex-1">
                  <Label htmlFor={option.key} className="text-base font-medium cursor-pointer">
                    {option.title}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    id={option.key}
                    type="button"
                    role="switch"
                    aria-checked={settings[option.key]}
                    onClick={() => handleToggle(option.key)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${settings[option.key] ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings[option.key] ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full"
              >
                {loading ? '保存中...' : '設定を保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>通知履歴</CardTitle>
          <CardDescription>
            最近受信した通知の履歴
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>通知履歴はまだありません</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
