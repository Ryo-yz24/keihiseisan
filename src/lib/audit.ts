import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

/**
 * 監査ログを作成する
 */
export async function createAuditLog({
  userId,
  action,
  tableName,
  recordId,
  oldValue,
  newValue,
  request,
}: {
  userId: string
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT'
  tableName: string
  recordId: string
  oldValue?: any
  newValue?: any
  request?: NextRequest
}) {
  try {
    // IPアドレスとUserAgentを取得
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (request) {
      // X-Forwarded-Forヘッダーから取得（プロキシ経由の場合）
      const forwardedFor = request.headers.get('x-forwarded-for')
      if (forwardedFor) {
        ipAddress = forwardedFor.split(',')[0].trim()
      } else {
        // 直接接続の場合
        ipAddress = request.headers.get('x-real-ip') || null
      }

      userAgent = request.headers.get('user-agent')
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // 監査ログの記録失敗はアプリケーションの動作に影響を与えないようにする
    console.error('Failed to create audit log:', error)
  }
}
