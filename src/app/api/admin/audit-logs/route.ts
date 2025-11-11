import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const filterAction = searchParams.get('action') || ''
    const filterTable = searchParams.get('table') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 検索条件の構築
    const where: any = {}

    if (searchTerm) {
      where.OR = [
        { action: { contains: searchTerm, mode: 'insensitive' } },
        { tableName: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ]
    }

    if (filterAction) {
      where.action = filterAction
    }

    if (filterTable) {
      where.tableName = filterTable
    }

    // 総件数取得
    const total = await prisma.auditLog.count({ where })

    // ログ取得（ページネーション対応）
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // レスポンスデータの整形
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name || log.user.email || 'Unknown',
      action: log.action,
      tableName: log.tableName,
      recordId: log.recordId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
