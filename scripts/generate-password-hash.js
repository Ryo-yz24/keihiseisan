/**
 * パスワードハッシュ生成スクリプト
 * password123のbcryptハッシュを生成します
 */

const bcrypt = require('bcryptjs')

async function generateHash() {
  const password = 'password123'
  const hash = await bcrypt.hash(password, 10)

  console.log('='.repeat(60))
  console.log('パスワードハッシュ生成結果')
  console.log('='.repeat(60))
  console.log(`元のパスワード: ${password}`)
  console.log(`生成されたハッシュ: ${hash}`)
  console.log('='.repeat(60))
  console.log('\n以下のSQLをSupabase SQL Editorで実行してください:\n')
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'master@example.com';`)
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'test@example.com';`)
  console.log('='.repeat(60))

  // 検証
  const isValid = await bcrypt.compare(password, hash)
  console.log(`\n検証: ${isValid ? '✓ ハッシュは正しく生成されました' : '✗ エラー'}`)
}

generateHash().catch(console.error)
