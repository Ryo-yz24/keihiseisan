'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Settings, LogOut, User, Shield, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedExpenseId?: string | null
}

interface DashboardHeaderProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: string
    masterUserId?: string | null
    canViewOthers: boolean
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    // 30秒ごとに通知を更新
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // クリック外部検知
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showNotifications])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const getNotificationLink = (notification: Notification): string => {
    // 通知タイプに応じた遷移先を決定
    switch (notification.type) {
      case 'EXPENSE_SUBMITTED':
        // 経費申請通知
        // マスターアカウント → ダッシュボードの承認待ちセクション
        // 子アカウント → 経費一覧
        return user.role === 'MASTER' ? '/dashboard#pending-expenses' : '/expenses'

      case 'EXPENSE_APPROVED':
      case 'EXPENSE_REJECTED':
        // 経費承認/却下通知 → 経費一覧
        return '/expenses'

      case 'LIMIT_INCREASE_REQUESTED':
        // 上限解放申請通知（子アカウント用） → ダッシュボードの上限解放情報
        return '/dashboard#exemption-info'

      case 'LIMIT_INCREASE_APPROVED':
      case 'LIMIT_INCREASE_REJECTED':
        // 上限解放承認/却下通知 → ダッシュボードの上限解放情報
        return '/dashboard#exemption-info'

      default:
        // デフォルトはダッシュボード
        return '/dashboard'
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 未読の場合のみ既読処理
      if (!notification.isRead) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id })
        })

        // ローカル状態を更新
        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      // 通知パネルを閉じる
      setShowNotifications(false)

      // 適切なページに遷移
      const link = getNotificationLink(notification)
      router.push(link)
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expense_approved':
      case 'exemption_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expense_rejected':
      case 'exemption_rejected':
        return <X className="h-4 w-4 text-red-600" />
      case 'expense_pending':
      case 'exemption_pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    if (days < 7) return `${days}日前`
    return date.toLocaleDateString('ja-JP')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ・タイトル */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">
                経費計上システム
              </h1>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="/dashboard"
              className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              ダッシュボード
            </a>
            <a
              href="/expenses"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              経費管理
            </a>
            {user.role === 'MASTER' && (
              <a
                href="/admin"
                className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                管理画面
              </a>
            )}
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-4">
            {/* 通知ベル */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 通知ドロップダウン */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">通知</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        すべて既読にする
                      </button>
                    )}
                  </div>

                  {/* 通知リスト */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>通知はありません</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* フッター */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <a
                        href="/notifications"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        すべての通知を見る
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'MASTER' ? 'マスターアカウント' : '子アカウント'}
                  </p>
                </div>
              </div>

              {/* ドロップダウンメニュー */}
              <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="h-5 w-5" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    プロフィール設定
                  </a>
                  <a
                    href="/notifications"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    通知設定
                  </a>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
