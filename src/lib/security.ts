import { NextRequest } from 'next/server'
import { prisma } from './prisma'

// セキュリティヘッダーの設定
export function setSecurityHeaders() {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
}

// ファイルアップロードの検証
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'サポートされていないファイル形式です。JPG、PNG、PDFのみアップロード可能です。' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。' }
  }

  return { isValid: true }
}

// ファイル名のサニタイズ
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100)
}

// 監査ログの記録
export async function logAuditEvent(
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  oldValue?: any,
  newValue?: any,
  request?: NextRequest
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
        newValue: newValue ? JSON.stringify(newValue) : undefined,
        ipAddress: request?.ip || request?.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown'
      }
    })
  } catch (error) {
    console.error('監査ログの記録に失敗しました:', error)
  }
}

// レート制限の実装
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15分
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  current.count++
  rateLimitMap.set(key, current)
  return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime }
}

// パスワード強度の検証
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('パスワードには大文字が含まれている必要があります')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('パスワードには小文字が含まれている必要があります')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字が含まれている必要があります')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('パスワードには記号が含まれている必要があります')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 権限チェック
export function hasPermission(
  userRole: string,
  userMasterId: string | null,
  targetMasterId: string | null,
  action: 'view' | 'edit' | 'delete' | 'approve'
): boolean {
  // マスターアカウントは全ての操作が可能
  if (userRole === 'MASTER') {
    return true
  }

  // 子アカウントの場合
  if (userRole === 'CHILD') {
    // 自分のマスターのデータのみアクセス可能
    if (userMasterId !== targetMasterId) {
      return false
    }

    // 承認操作は子アカウントには許可しない
    if (action === 'approve') {
      return false
    }

    return true
  }

  return false
}

