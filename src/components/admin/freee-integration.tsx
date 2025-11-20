'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

interface FreeeStatus {
  enabled: boolean
  connected: boolean
  integration?: {
    companyId: number
    companyName: string | null
    isActive: boolean
    autoSync: boolean
    lastSyncAt: Date | null
    tokenExpiresAt: Date
  }
}

interface CategoryMapping {
  id: string
  categoryName: string
  freeeAccountItemId: number
  freeeAccountItemName: string
}

interface AccountItem {
  id: number
  name: string
  shortcut?: string
}

export function FreeeIntegration() {
  const [status, setStatus] = useState<FreeeStatus | null>(null)
  const [mappings, setMappings] = useState<CategoryMapping[]>([])
  const [accountItems, setAccountItems] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedAccountItem, setSelectedAccountItem] = useState<string>('')
  const [autoSync, setAutoSync] = useState(false)

  // 経費カテゴリ一覧（グローバルカテゴリから取得）
  const categories = [
    '交通費',
    '宿泊費',
    '会議費',
    '通信費',
    '消耗品費',
    '交際費',
    '図書費',
    '研修費',
    '外注費',
    'その他',
  ]

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    if (status?.connected) {
      fetchMappings()
    }
  }, [status])

  useEffect(() => {
    if (status?.integration) {
      setAutoSync(status.integration.autoSync)
    }
  }, [status])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/freee/status?_t=${Date.now()}`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching freee status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMappings = async () => {
    try {
      const response = await fetch(`/api/freee/mappings?_t=${Date.now()}`)
      const data = await response.json()
      if (data.success) {
        setMappings(data.mappings)
        setAccountItems(data.accountItems)
      }
    } catch (error) {
      console.error('Error fetching mappings:', error)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      window.location.href = '/api/freee/auth'
    } catch (error) {
      console.error('Error connecting to freee:', error)
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('freee連携を解除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch('/api/freee/disconnect', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        await fetchStatus()
        setMappings([])
        setAccountItems([])
      } else {
        alert(data.error || '連携解除に失敗しました')
      }
    } catch (error) {
      console.error('Error disconnecting from freee:', error)
      alert('連携解除に失敗しました')
    }
  }

  const handleSaveMapping = async () => {
    if (!selectedCategory || !selectedAccountItem) {
      alert('カテゴリと勘定科目を選択してください')
      return
    }

    try {
      const accountItem = accountItems.find(
        (item) => item.id === Number(selectedAccountItem)
      )

      const response = await fetch('/api/freee/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: selectedCategory,
          freeeAccountItemId: Number(selectedAccountItem),
          freeeAccountItemName: accountItem?.name || '',
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchMappings()
        setSelectedCategory('')
        setSelectedAccountItem('')
      } else {
        alert(data.error || 'マッピングの保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving mapping:', error)
      alert('マッピングの保存に失敗しました')
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('このマッピングを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/freee/mappings?id=${mappingId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchMappings()
      } else {
        alert(data.error || 'マッピングの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting mapping:', error)
      alert('マッピングの削除に失敗しました')
    }
  }

  const handleToggleAutoSync = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/freee/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSync: enabled }),
      })

      const data = await response.json()

      if (data.success) {
        setAutoSync(enabled)
        await fetchStatus()
      } else {
        alert(data.error || '設定の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating auto sync:', error)
      alert('設定の更新に失敗しました')
    }
  }

  const handleManualSync = async () => {
    if (!confirm('承認済みの経費をfreeeに同期しますか？')) {
      return
    }

    setSyncing(true)
    try {
      // 承認済みの経費IDを取得
      const expensesResponse = await fetch(`/api/admin/expenses?_t=${Date.now()}`)
      const expensesData = await expensesResponse.json()

      const approvedExpenses = expensesData.expenses.filter(
        (expense: any) => expense.status === 'APPROVED'
      )

      if (approvedExpenses.length === 0) {
        alert('同期する承認済み経費がありません')
        return
      }

      const expenseIds = approvedExpenses.map((expense: any) => expense.id)

      const response = await fetch('/api/freee/sync/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseIds }),
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        await fetchStatus()
      } else {
        alert(data.error || '同期に失敗しました')
      }
    } catch (error) {
      console.error('Error syncing to freee:', error)
      alert('同期に失敗しました')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>freee連携</CardTitle>
          <CardDescription>
            会計ソフトfreeeとの連携設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status?.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>freee連携</CardTitle>
          <CardDescription>
            会計ソフトfreeeとの連携設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                freee連携を使用するには、環境変数の設定が必要です。
              </p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm font-medium mb-2">必要な環境変数:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• FREEE_CLIENT_ID</li>
                <li>• FREEE_CLIENT_SECRET</li>
                <li>• FREEE_REDIRECT_URI</li>
                <li>• FREEE_TOKEN_ENCRYPTION_KEY</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 接続状態 */}
      <Card>
        <CardHeader>
          <CardTitle>freee連携</CardTitle>
          <CardDescription>
            会計ソフトfreeeとの連携設定
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>接続状態</Label>
              <div className="flex items-center gap-2">
                {status.connected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">
                      {status.integration?.companyName || '接続済み'}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {status.integration?.isActive ? 'アクティブ' : '無効'}
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-muted-foreground">未接続</span>
                  </>
                )}
              </div>
            </div>
            <div>
              {status.connected ? (
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                >
                  連携解除
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  freeeと連携
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {status.connected && status.integration && (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>自動同期</Label>
                  <p className="text-sm text-muted-foreground">
                    経費が承認されたら自動的にfreeeに同期
                  </p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={handleToggleAutoSync}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>手動同期</Label>
                  <p className="text-sm text-muted-foreground">
                    承認済みの経費を今すぐfreeeに同期
                  </p>
                  {status.integration.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      最終同期: {new Date(status.integration.lastSyncAt).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={syncing}
                >
                  {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  今すぐ同期
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* カテゴリマッピング */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>カテゴリマッピング</CardTitle>
            <CardDescription>
              経費カテゴリとfreeeの勘定科目を紐付けます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 新規マッピング追加 */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>経費カテゴリ</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {categories
                      .filter(
                        (cat) =>
                          !mappings.some((m) => m.categoryName === cat)
                      )
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>freee勘定科目</Label>
                <Select
                  value={selectedAccountItem}
                  onValueChange={setSelectedAccountItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="勘定科目を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {accountItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                        {item.shortcut && ` (${item.shortcut})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSaveMapping}
                  disabled={!selectedCategory || !selectedAccountItem}
                  className="w-full"
                >
                  追加
                </Button>
              </div>
            </div>

            {/* マッピング一覧 */}
            {mappings.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>経費カテゴリ</TableHead>
                      <TableHead>freee勘定科目</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-medium">
                          {mapping.categoryName}
                        </TableCell>
                        <TableCell>{mapping.freeeAccountItemName}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMapping(mapping.id)}
                          >
                            削除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  カテゴリマッピングが設定されていません
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
