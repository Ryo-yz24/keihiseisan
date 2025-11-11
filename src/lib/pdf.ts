import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// 日本語フォント対応のための設定
// 注: 日本語を正しく表示するには、フォントファイルを追加する必要があります
// ここでは基本的な設定のみ行い、英数字と記号で代替表示します

interface ExpenseData {
  id: string
  expenseDate: Date | string
  amount: number
  category: string
  vendor: string
  purpose: string
  status: string
  createdAt?: Date | string
  approvedBy?: string | null
  approvedAt?: Date | string | null
}

interface MonthlyReportData {
  year: number
  month: number
  expenses: ExpenseData[]
  totalAmount: number
  categoryBreakdown: Array<{
    category: string
    total: number
    count: number
  }>
}

// 数値をカンマ区切りの通貨フォーマットに変換
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

// 日付フォーマット
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// ステータスを日本語に変換
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'Pending',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'DRAFT': 'Draft',
    'REVISION': 'Revision'
  }
  return statusMap[status] || status
}

// 経費明細PDFを生成
export function generateExpensePDF(expense: ExpenseData): jsPDF {
  const doc = new jsPDF()

  // タイトル
  doc.setFontSize(20)
  doc.text('Expense Detail', 20, 20)

  // 経費情報
  doc.setFontSize(12)
  let y = 40

  doc.text(`ID: ${expense.id}`, 20, y)
  y += 10
  doc.text(`Date: ${formatDate(expense.expenseDate)}`, 20, y)
  y += 10
  doc.text(`Amount: ${formatCurrency(expense.amount)}`, 20, y)
  y += 10
  doc.text(`Category: ${expense.category}`, 20, y)
  y += 10
  doc.text(`Vendor: ${expense.vendor}`, 20, y)
  y += 10
  doc.text(`Purpose: ${expense.purpose}`, 20, y)
  y += 10
  doc.text(`Status: ${getStatusText(expense.status)}`, 20, y)

  if (expense.approvedBy && expense.approvedAt) {
    y += 10
    doc.text(`Approved By: ${expense.approvedBy}`, 20, y)
    y += 10
    doc.text(`Approved At: ${formatDate(expense.approvedAt)}`, 20, y)
  }

  // フッター
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString('ja-JP')}`, 20, 280)

  return doc
}

// 経費リストPDFを生成
export function generateExpenseListPDF(
  expenses: ExpenseData[],
  title: string = 'Expense List'
): jsPDF {
  const doc = new jsPDF()

  // タイトル
  doc.setFontSize(20)
  doc.text(title, 20, 20)

  // 合計金額
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  doc.setFontSize(12)
  doc.text(`Total: ${formatCurrency(totalAmount)}`, 20, 30)
  doc.text(`Count: ${expenses.length} items`, 20, 37)

  // テーブル
  autoTable(doc, {
    startY: 45,
    head: [['Date', 'Category', 'Vendor', 'Amount', 'Status']],
    body: expenses.map(e => [
      formatDate(e.expenseDate),
      e.category,
      e.vendor,
      formatCurrency(e.amount),
      getStatusText(e.status)
    ]),
    styles: { fontSize: 10, font: 'helvetica' },
    headStyles: { fillColor: [30, 64, 175] },
    columnStyles: {
      3: { halign: 'right' } // 金額列を右寄せ
    }
  })

  // フッター
  doc.setFontSize(10)
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.text(
    `Generated: ${new Date().toLocaleString('ja-JP')} | Page ${pageCount}`,
    20,
    doc.internal.pageSize.height - 10
  )

  return doc
}

// 月次レポートPDFを生成
export function generateMonthlyReportPDF(data: MonthlyReportData): jsPDF {
  const doc = new jsPDF()

  // タイトル
  doc.setFontSize(20)
  doc.text(`Monthly Report - ${data.year}/${data.month}`, 20, 20)

  // サマリー
  doc.setFontSize(12)
  doc.text(`Total Amount: ${formatCurrency(data.totalAmount)}`, 20, 35)
  doc.text(`Total Count: ${data.expenses.length} expenses`, 20, 42)

  // カテゴリ別集計テーブル
  doc.setFontSize(14)
  doc.text('Category Breakdown', 20, 55)

  autoTable(doc, {
    startY: 60,
    head: [['Category', 'Count', 'Total Amount']],
    body: data.categoryBreakdown.map(c => [
      c.category,
      c.count.toString(),
      formatCurrency(c.total)
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 64, 175] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' }
    }
  })

  // 経費詳細テーブル
  const finalY = (doc as any).lastAutoTable.finalY || 60
  doc.setFontSize(14)
  doc.text('Expense Details', 20, finalY + 15)

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Date', 'Category', 'Vendor', 'Amount', 'Status']],
    body: data.expenses.map(e => [
      formatDate(e.expenseDate),
      e.category,
      e.vendor,
      formatCurrency(e.amount),
      getStatusText(e.status)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
    columnStyles: {
      3: { halign: 'right' }
    }
  })

  // フッター
  doc.setFontSize(10)
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Generated: ${new Date().toLocaleString('ja-JP')} | Page ${i}/${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    )
  }

  return doc
}

// PDFをダウンロード
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}

// PDFをBlob形式で取得（プレビュー用）
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob')
}

// PDFをBase64形式で取得（メール添付用）
export function getPDFBase64(doc: jsPDF): string {
  return doc.output('dataurlstring')
}
