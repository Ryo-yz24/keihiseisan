'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Mail, Lock, AlertCircle, CheckCircle, Home } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'プロフィールを更新しました' })
        // セッションを更新
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: data.error || 'プロフィールの更新に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '新しいパスワードが一致しません' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'パスワードは8文字以上で設定してください' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'パスワードを変更しました' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'パスワードの変更に失敗しました' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'エラーが発生しました' })
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">プロフィール設定</h1>
          <p className="text-gray-600 mt-2">アカウント情報を管理します</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* プロフィール情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>ロール</Label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
                  {session.user.role === 'MASTER' ? '管理者' : '一般ユーザー'}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '更新中...' : '基本情報を更新'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* パスワード変更 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              パスワード変更
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMessage && (
                <div className={`p-4 rounded-md flex items-center ${
                  passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">現在のパスワード</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-sm text-gray-600">8文字以上で設定してください</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '変更中...' : 'パスワードを変更'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
