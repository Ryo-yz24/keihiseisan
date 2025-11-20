import { NextResponse } from 'next/server'
import { getAuthorizationUrl, FREEE_CONFIG } from '@/lib/freee'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = randomBytes(32).toString('hex')
  const authUrl = getAuthorizationUrl(state)

  return NextResponse.json({
    config: {
      clientId: FREEE_CONFIG.clientId,
      redirectUri: FREEE_CONFIG.redirectUri,
      authUrl: FREEE_CONFIG.authUrl,
    },
    generatedUrl: authUrl,
    parsedParams: Object.fromEntries(new URL(authUrl).searchParams),
  })
}
