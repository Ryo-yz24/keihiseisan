import crypto from 'crypto'

// freee API設定
export const FREEE_CONFIG = {
  clientId: process.env.FREEE_CLIENT_ID || '',
  clientSecret: process.env.FREEE_CLIENT_SECRET || '',
  redirectUri: process.env.FREEE_REDIRECT_URI || '',
  authUrl: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  tokenUrl: 'https://accounts.secure.freee.co.jp/public_api/token',
  apiBaseUrl: 'https://api.freee.co.jp/api/1',
  encryptionKey: process.env.FREEE_TOKEN_ENCRYPTION_KEY || '',
}

// freee APIが有効かチェック
export function isFreeeEnabled(): boolean {
  return !!(
    FREEE_CONFIG.clientId &&
    FREEE_CONFIG.clientSecret &&
    FREEE_CONFIG.redirectUri &&
    FREEE_CONFIG.encryptionKey
  )
}

// トークンの暗号化
export function encryptToken(token: string): string {
  if (!FREEE_CONFIG.encryptionKey) {
    throw new Error('Encryption key is not configured')
  }

  const iv = crypto.randomBytes(16)
  const key = Buffer.from(FREEE_CONFIG.encryptionKey.padEnd(32, '0').slice(0, 32))
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// トークンの復号化
export function decryptToken(encryptedToken: string): string {
  if (!FREEE_CONFIG.encryptionKey) {
    throw new Error('Encryption key is not configured')
  }

  const parts = encryptedToken.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = Buffer.from(FREEE_CONFIG.encryptionKey.padEnd(32, '0').slice(0, 32))

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// OAuth認証URLを生成
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: FREEE_CONFIG.clientId,
    redirect_uri: FREEE_CONFIG.redirectUri,
    response_type: 'code',
    state,
  })

  return `${FREEE_CONFIG.authUrl}?${params.toString()}`
}

// 認証コードからトークンを取得
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: FREEE_CONFIG.clientId,
    client_secret: FREEE_CONFIG.clientSecret,
    redirect_uri: FREEE_CONFIG.redirectUri,
    code,
  })

  const response = await fetch(FREEE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in, // 通常24時間（86400秒）
  }
}

// リフレッシュトークンで新しいアクセストークンを取得
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: FREEE_CONFIG.clientId,
    client_secret: FREEE_CONFIG.clientSecret,
    refresh_token: refreshToken,
  })

  const response = await fetch(FREEE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh access token: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

// freee APIリクエスト
export async function freeeApiRequest<T = any>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FREEE_CONFIG.apiBaseUrl}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`freee API request failed: ${error}`)
  }

  return response.json()
}

// 事業所一覧を取得
export async function getCompanies(accessToken: string) {
  return freeeApiRequest('/companies', accessToken)
}

// 勘定科目一覧を取得
export async function getAccountItems(accessToken: string, companyId: number) {
  return freeeApiRequest(
    `/account_items?company_id=${companyId}`,
    accessToken
  )
}

// 取引先一覧を取得
export async function getPartners(accessToken: string, companyId: number) {
  return freeeApiRequest(
    `/partners?company_id=${companyId}`,
    accessToken
  )
}

// 取引（経費）を登録
export async function createDeal(
  accessToken: string,
  companyId: number,
  dealData: {
    issue_date: string
    type: 'expense'
    partner_id?: number
    partner_code?: string
    details: Array<{
      account_item_id: number
      tax_code: number
      amount: number
      description?: string
    }>
  }
) {
  return freeeApiRequest('/deals', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      company_id: companyId,
      ...dealData,
    }),
  })
}

// 消費税コードのマッピング
export function getTaxCode(taxRate: number): number {
  // freeeの消費税コード
  // https://developer.freee.co.jp/docs/accounting/reference#/税区分
  switch (taxRate) {
    case 10:
      return 108 // 課税仕入10%（一般）
    case 8:
      return 107 // 課税仕入8%（軽減税率）
    case 0:
      return 130 // 非課税
    default:
      return 108 // デフォルトは10%
  }
}
