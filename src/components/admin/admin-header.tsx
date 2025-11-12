'use client'

import { signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Settings, LogOut, User, Shield, AlertTriangle, Home, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AdminHeaderProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
    masterUserId?: string | null
    canViewOthers: boolean
  }
  onMenuClick: () => void
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  relatedExpenseId?: string | null
  createdAt: string
  relatedExpense?: {
    id: string
    amount: number
    vendor: string
    category: string
  }
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()

    // 30秒ごとに通知を再取得
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const getNotificationLink = (notification: Notification): string => {
    // 通知タイプに応じた遷移先を決定
    switch (notification.type) {
      case 'EXPENSE_SUBMITTED':
        // 経費申請通知 → ダッシュボード内の承認待ち経費セクション
        return '/dashboard#pending-expenses'

      case 'EXPENSE_APPROVED':
      case 'EXPENSE_REJECTED':
        // 経費承認/却下通知 → ダッシュボードの経費一覧
        return '/dashboard/expenses'

      case 'LIMIT_INCREASE_REQUESTED':
        // 上限解放申請通知 → 管理画面の上限解放管理タブ
        return '/admin?tab=exemption'

      case 'LIMIT_INCREASE_APPROVED':
      case 'LIMIT_INCREASE_REJECTED':
        // 上限解放承認/却下通知 → ダッシュボード
        return '/dashboard'

      default:
        // デフォルトは管理画面Top
        return '/admin'
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

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        // 通知を再取得
        await fetchNotifications()
        setShowNotifications(false)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EXPENSE_SUBMITTED':
      case 'LIMIT_INCREASE_REQUESTED':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'EXPENSE_APPROVED':
      case 'LIMIT_INCREASE_APPROVED':
        return <Check className="h-4 w-4 text-green-600" />
      case 'EXPENSE_REJECTED':
      case 'LIMIT_INCREASE_REJECTED':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={onMenuClick} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center ml-4">
              <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">管理画面</h1>
                <p className="text-sm text-gray-500">システム管理</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">ホームに戻る</span>
            </Link>
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">管理者モード</span>
            </div>
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 通知ドロップダウン */}
              {showNotifications && (
                <>
                  {/* オーバーレイ */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>

                  {/* 通知パネル */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">通知</h3>
                        {unreadCount > 0 && (
                          <span className="text-sm text-gray-500">{unreadCount}件の未読</span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
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
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title || notification.message}
                                  </p>
                                  {notification.title && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {notification.message}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleString('ja-JP')}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0">
                                    <span className="inline-block h-2 w-2 bg-blue-600 rounded-full"></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && unreadCount > 0 && (
                      <div className="p-3 border-t border-gray-200 text-center">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          onClick={handleMarkAllAsRead}
                        >
                          すべて既読にする
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-red-600 font-medium">マスターアカウント</p>
                </div>
              </div>
              <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="h-5 w-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">プロフィール設定</a>
                  <a href="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">通知設定</a>
                  <div className="border-t border-gray-100"></div>
                  <button onClick={handleSignOut} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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
