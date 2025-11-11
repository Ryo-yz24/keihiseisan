import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { createAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// PATCH: 経費の更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // 既存の経費を取得
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // 自分の経費のみ編集可能
    if (existingExpense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 承認済みの経費は編集不可
    if (existingExpense.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot edit approved expense' }, { status: 400 })
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
    const status = (statusValue || existingExpense.status) as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION'

    // 税率をパーセント値から小数値に変換
    const taxRate = taxRatePercent / 100

    if (!expenseDate || !amount || !vendor || !purpose || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 変更前のデータを保存（監査ログ用）
    const oldData = {
      amount: existingExpense.amount.toString(),
      vendor: existingExpense.vendor,
      category: existingExpense.category,
      status: existingExpense.status,
    }

    // 経費を更新
    const expense = await prisma.expense.update({
      where: { id },
      data: {
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

    // 新しい画像がある場合は追加
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
      action: 'UPDATE',
      tableName: 'expenses',
      recordId: expense.id,
      oldValue: oldData,
      newValue: {
        amount: expense.amount.toString(),
        vendor: expense.vendor,
        category: expense.category,
        status: expense.status,
      },
      request,
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 経費の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // 既存の経費を取得
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: { images: true },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // 自分の経費のみ削除可能
    if (existingExpense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 承認済みの経費は削除不可
    if (existingExpense.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot delete approved expense' }, { status: 400 })
    }

    // 画像ファイルを削除
    for (const image of existingExpense.images) {
      try {
        const filepath = path.join(process.cwd(), 'public', image.filePath)
        await unlink(filepath)
      } catch (err) {
        console.error('Error deleting image file:', err)
      }
    }

    // 画像レコードを削除
    await prisma.expenseImage.deleteMany({
      where: { expenseId: id },
    })

    // 経費を削除
    await prisma.expense.delete({
      where: { id },
    })

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'expenses',
      recordId: id,
      oldValue: {
        amount: existingExpense.amount.toString(),
        vendor: existingExpense.vendor,
        category: existingExpense.category,
        status: existingExpense.status,
      },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
