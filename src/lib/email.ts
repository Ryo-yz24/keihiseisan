import nodemailer from 'nodemailer'

// メール送信の設定
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// メール送信タイプ
export type EmailType =
  | 'expense_submitted'      // 経費申請時（MASTER宛）
  | 'expense_approved'       // 経費承認時（申請者宛）
  | 'expense_rejected'       // 経費却下時（申請者宛）
  | 'exemption_submitted'    // 上限解放申請時（MASTER宛）
  | 'exemption_approved'     // 上限解放承認時（申請者宛）
  | 'exemption_rejected'     // 上限解放却下時（申請者宛）

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

// メールテンプレート
function getEmailTemplate(type: EmailType, data: any): EmailData {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  switch (type) {
    case 'expense_submitted':
      return {
        to: data.masterEmail,
        subject: '【経費精算】新しい経費申請があります',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">新しい経費申請</h2>
            <p>${data.userName}さんから経費申請が提出されました。</p>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>申請者:</strong> ${data.userName}</p>
              <p style="margin: 8px 0;"><strong>金額:</strong> ¥${data.amount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>カテゴリ:</strong> ${data.category}</p>
              <p style="margin: 8px 0;"><strong>支払先:</strong> ${data.vendor}</p>
              <p style="margin: 8px 0;"><strong>目的:</strong> ${data.purpose}</p>
            </div>

            <a href="${baseUrl}/admin"
               style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              承認画面を開く
            </a>
          </div>
        `,
        text: `新しい経費申請\n\n申請者: ${data.userName}\n金額: ¥${data.amount}\nカテゴリ: ${data.category}\n\n${baseUrl}/admin`
      }

    case 'expense_approved':
      return {
        to: data.userEmail,
        subject: '【経費精算】経費申請が承認されました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">経費申請が承認されました</h2>
            <p>あなたの経費申請が承認されました。</p>

            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 8px 0;"><strong>金額:</strong> ¥${data.amount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>カテゴリ:</strong> ${data.category}</p>
              <p style="margin: 8px 0;"><strong>承認日:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
            </div>

            <a href="${baseUrl}/dashboard"
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ダッシュボードを開く
            </a>
          </div>
        `,
        text: `経費申請が承認されました\n\n金額: ¥${data.amount}\nカテゴリ: ${data.category}\n\n${baseUrl}/dashboard`
      }

    case 'expense_rejected':
      return {
        to: data.userEmail,
        subject: '【経費精算】経費申請が却下されました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">経費申請が却下されました</h2>
            <p>あなたの経費申請が却下されました。</p>

            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 8px 0;"><strong>金額:</strong> ¥${data.amount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>カテゴリ:</strong> ${data.category}</p>
              ${data.reason ? `<p style="margin: 8px 0;"><strong>却下理由:</strong> ${data.reason}</p>` : ''}
            </div>

            <a href="${baseUrl}/dashboard"
               style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ダッシュボードを開く
            </a>
          </div>
        `,
        text: `経費申請が却下されました\n\n金額: ¥${data.amount}\nカテゴリ: ${data.category}\n${data.reason ? `却下理由: ${data.reason}\n` : ''}\n${baseUrl}/dashboard`
      }

    case 'exemption_submitted':
      return {
        to: data.masterEmail,
        subject: '【経費精算】上限解放申請があります',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">上限解放申請</h2>
            <p>${data.userName}さんから上限解放申請が提出されました。</p>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>申請者:</strong> ${data.userName}</p>
              <p style="margin: 8px 0;"><strong>対象年月:</strong> ${data.year}年${data.month}月</p>
              <p style="margin: 8px 0;"><strong>現在の使用額:</strong> ¥${data.currentAmount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>限度額:</strong> ¥${data.limitAmount.toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>理由:</strong> ${data.reason}</p>
            </div>

            <a href="${baseUrl}/admin"
               style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              承認画面を開く
            </a>
          </div>
        `,
        text: `上限解放申請\n\n申請者: ${data.userName}\n対象: ${data.year}年${data.month}月\n理由: ${data.reason}\n\n${baseUrl}/admin`
      }

    case 'exemption_approved':
      return {
        to: data.userEmail,
        subject: '【経費精算】上限解放申請が承認されました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">上限解放申請が承認されました</h2>
            <p>あなたの上限解放申請が承認されました。</p>

            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 8px 0;"><strong>対象年月:</strong> ${data.year}年${data.month}月</p>
              <p style="margin: 8px 0;"><strong>承認日:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
            </div>

            <a href="${baseUrl}/dashboard"
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ダッシュボードを開く
            </a>
          </div>
        `,
        text: `上限解放申請が承認されました\n\n対象: ${data.year}年${data.month}月\n\n${baseUrl}/dashboard`
      }

    case 'exemption_rejected':
      return {
        to: data.userEmail,
        subject: '【経費精算】上限解放申請が却下されました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">上限解放申請が却下されました</h2>
            <p>あなたの上限解放申請が却下されました。</p>

            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 8px 0;"><strong>対象年月:</strong> ${data.year}年${data.month}月</p>
              ${data.rejectionReason ? `<p style="margin: 8px 0;"><strong>却下理由:</strong> ${data.rejectionReason}</p>` : ''}
            </div>

            <a href="${baseUrl}/dashboard"
               style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ダッシュボードを開く
            </a>
          </div>
        `,
        text: `上限解放申請が却下されました\n\n対象: ${data.year}年${data.month}月\n${data.rejectionReason ? `却下理由: ${data.rejectionReason}\n` : ''}\n${baseUrl}/dashboard`
      }

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

// メール送信関数
export async function sendEmail(type: EmailType, data: any): Promise<boolean> {
  // 開発環境ではメール送信をスキップ（ログのみ）
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_EMAIL_IN_DEV) {
    console.log('📧 [Email] Skipping in development mode')
    console.log('Type:', type)
    console.log('Data:', data)
    return true
  }

  // SMTP設定が不完全な場合はスキップ
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ [Email] SMTP credentials not configured')
    return false
  }

  try {
    const emailData = getEmailTemplate(type, data)

    await transporter.sendMail({
      from: `"経費精算システム" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || '',
      html: emailData.html,
    })

    console.log(`✅ [Email] Sent ${type} to ${emailData.to}`)
    return true
  } catch (error) {
    console.error('❌ [Email] Failed to send:', error)
    return false
  }
}

// メール送信テスト用関数
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log('✅ [Email] SMTP connection verified')
    return true
  } catch (error) {
    console.error('❌ [Email] SMTP connection failed:', error)
    return false
  }
}
