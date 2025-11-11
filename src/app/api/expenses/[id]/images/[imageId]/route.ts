import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, imageId } = params

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (expense.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot delete image from approved expense' }, { status: 400 })
    }

    const image = await prisma.expenseImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    try {
      const filepath = path.join(process.cwd(), 'public', image.filePath)
      await unlink(filepath)
    } catch (err) {
      console.error('Error deleting image file:', err)
    }

    await prisma.expenseImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
