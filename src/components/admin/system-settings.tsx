'use client'

import { useState } from 'react'
import { 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  Database,
  Bell,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface SystemSettingsProps {
  masterUserId: string
}

export function SystemSettings({ masterUserId }: SystemSettingsProps) {
  const [settings, setSettings] = useState({
    // セキュリティ設定
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    
    // 通知設定
    emailNotifications: true,
    systemNotifications: true,
    approvalNotifications: true,
    limitAlertThreshold: 70,
    
    // システム設定
    maintenanceMode: false,
    allowUserRegistration: false,
    requireEmailVerification: true,
    dataRetentionDays: 365,
    
    // メール設定
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: ''
  })

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      // TODO: 設定保存APIを呼び出し
      await new Promise(resolve => setTimeout(resolve, 1000)) // モック
      setSaveStatus('success')
    } catch (error) {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('設定をデフォルトに戻しますか？')) {
      // TODO: デフォルト設定にリセット
      console.log('設定をリセット')
    }
  }

  const SettingCard = ({ title, description, icon: Icon, children }: {
    title: string
    description: string
    icon: any
    children: React.ReactNode
  }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-red-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-4">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
          <p className="mt-1 text-sm text-gray-500">
            システム全体の設定・管理を行います
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            リセット
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </button>
        </div>
      </div>

      {/* 保存ステータス */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">設定が保存されました</p>
            </div>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">設定の保存に失敗しました</p>
            </div>
          </div>
        </div>
      )}

      {/* セキュリティ設定 */}
      <SettingCard
        title="セキュリティ設定"
        description="パスワードポリシー、セッション管理、ログイン制限などの設定"
        icon={Shield}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード最小文字数
            </label>
            <input
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セッションタイムアウト（時間）
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大ログイン試行回数
            </label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アカウントロック時間（分）
            </label>
            <input
              type="number"
              value={settings.lockoutDuration}
              onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.passwordRequireSpecialChar}
              onChange={(e) => setSettings({...settings, passwordRequireSpecialChar: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">パスワードに記号を必須とする</span>
          </label>
        </div>
      </SettingCard>

      {/* 通知設定 */}
      <SettingCard
        title="通知設定"
        description="メール通知、システム通知、アラート設定"
        icon={Bell}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">メール通知</label>
              <p className="text-xs text-gray-500">経費申請・承認に関するメール通知</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">システム通知</label>
              <p className="text-xs text-gray-500">システム内での通知表示</p>
            </div>
            <input
              type="checkbox"
              checked={settings.systemNotifications}
              onChange={(e) => setSettings({...settings, systemNotifications: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">承認通知</label>
              <p className="text-xs text-gray-500">経費申請の承認・却下通知</p>
            </div>
            <input
              type="checkbox"
              checked={settings.approvalNotifications}
              onChange={(e) => setSettings({...settings, approvalNotifications: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              限度額アラート閾値（%）
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.limitAlertThreshold}
              onChange={(e) => setSettings({...settings, limitAlertThreshold: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
      </SettingCard>

      {/* システム設定 */}
      <SettingCard
        title="システム設定"
        description="メンテナンスモード、ユーザー登録、データ保持期間などの設定"
        icon={Database}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">メンテナンスモード</label>
              <p className="text-xs text-gray-500">システムを一時的に停止</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">ユーザー登録を許可</label>
              <p className="text-xs text-gray-500">新規ユーザーの自己登録を許可</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowUserRegistration}
              onChange={(e) => setSettings({...settings, allowUserRegistration: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">メール認証を必須とする</label>
              <p className="text-xs text-gray-500">新規登録時にメール認証を必須とする</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              データ保持期間（日数）
            </label>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => setSettings({...settings, dataRetentionDays: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
      </SettingCard>

      {/* メール設定 */}
      <SettingCard
        title="メール設定"
        description="SMTPサーバー設定、送信者情報の設定"
        icon={Mail}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTPホスト
            </label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTPポート
            </label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTPユーザー名
            </label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTPパスワード
            </label>
            <input
              type="password"
              value={settings.smtpPassword}
              onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              送信者メールアドレス
            </label>
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(e) => setSettings({...settings, fromEmail: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              送信者名
            </label>
            <input
              type="text"
              value={settings.fromName}
              onChange={(e) => setSettings({...settings, fromName: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  )
}


