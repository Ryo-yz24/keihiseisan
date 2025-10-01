// シンプルなメモリベースのレート制限
const attempts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now()
  const key = identifier
  const attempt = attempts.get(key)

  if (!attempt || now > attempt.resetTime) {
    // 新しいウィンドウを開始
    attempts.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: maxAttempts - 1 }
  }

  if (attempt.count >= maxAttempts) {
    return { 
      success: false, 
      remaining: 0, 
      resetTime: attempt.resetTime 
    }
  }

  // カウントを増加
  attempt.count++
  attempts.set(key, attempt)

  return { 
    success: true, 
    remaining: maxAttempts - attempt.count 
  }
}

// 古いエントリをクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  attempts.forEach((attempt, key) => {
    if (now > attempt.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => attempts.delete(key))
}, 5 * 60 * 1000) // 5分ごとにクリーンアップ
