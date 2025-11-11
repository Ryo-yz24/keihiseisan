import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { createAuditLog } from '@/lib/audit'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId: session.user.id }
    if (status && status !== 'all') {
      where.status = status
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: { images: true },
    })

    return NextResponse.json({ success: true, expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const expenseDate = formData.get('expenseDate') as string
    const amount = parseFloat(formData.get('amount') as string)
    const taxRatePercent = parseFloat(formData.get('taxRate') as string)
    const taxAmount = parseFloat(formData.get('taxAmount') as string)
    const amountWithoutTax = parseFloat(formData.get('amountWithoutTax') as string)
    const vendor = formData.get('vendor') as string
    const purpose = formData.get('purpose') as string
    const category = formData.get('category') as string
    const statusValue = formData.get('status') as string
    const status = (statusValue || 'PENDING') as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION'

    // 税率をパーセント値から小数値に変換 (10% -> 0.10)
    const taxRate = taxRatePercent / 100

    if (!expenseDate || !amount || !vendor || !purpose || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        expenseDate: new Date(expenseDate),
        amount,
        taxRate,
        taxAmount,
        amountWithoutTax,
        vendor,
        purpose,
        category,
        status,
      },
    })

    const images = formData.getAll('images') as File[]
    if (images.length > 0 && images[0].size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'expenses', expense.id)
      await mkdir(uploadDir, { recursive: true })

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const buffer = Buffer.from(await image.arrayBuffer())
        const filename = `${Date.now()}-${i}-${image.name}`
        const filepath = path.join(uploadDir, filename)
        await writeFile(filepath, buffer)

        await prisma.expenseImage.create({
          data: {
            expenseId: expense.id,
            filePath: `/uploads/expenses/${expense.id}/${filename}`,
            fileName: image.name,
            fileSize: image.size,
            mimeType: image.type,
          },
        })
      }
    }

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'expenses',
      recordId: expense.id,
      newValue: {
        amount: expense.amount.toString(),
        vendor: expense.vendor,
        category: expense.category,
        status: expense.status,
      },
      request,
    })

    // 経費申請時にマスターユーザーにメール通知（PENDING状態の場合のみ）
    if (expense.status === 'PENDING') {
      try {
        // ユーザー情報とマスターユーザー情報を取得
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true, masterUserId: true }
        })

        if (user?.masterUserId) {
          const masterUser = await prisma.user.findUnique({
            where: { id: user.masterUserId },
            select: { email: true }
          })

          if (masterUser?.email) {
            await sendEmail('expense_submitted', {
              masterEmail: masterUser.email,
              userName: user.name || user.email,
              amount: expense.amount,
              category: expense.category,
              vendor: expense.vendor,
              purpose: expense.purpose,
            })
          }
        }
      } catch (emailError) {
        // メール送信エラーは記録するが、経費作成自体は成功とする
        console.error('Failed to send email notification:', emailError)
      }
    }

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
