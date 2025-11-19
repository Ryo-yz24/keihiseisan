const { PrismaClient } = require('@prisma/client')

/**
 * カテゴリをグローバルシステムに移行するスクリプト
 * - 重複カテゴリを統合
 * - displayOrderを再調整
 */
async function migrateToGlobalCategories() {
  const prisma = new PrismaClient()

  try {
    console.log('🚀 グローバルカテゴリシステムへの移行を開始します\n')

    // 1. 現在のカテゴリ一覧を取得
    const categories = await prisma.category.findMany({
      include: {
        masterUser: {
          select: { email: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`現在のカテゴリ数: ${categories.length}件\n`)

    // 2. カテゴリ名でグループ化
    const categoryGroups = {}
    categories.forEach(cat => {
      if (!categoryGroups[cat.name]) {
        categoryGroups[cat.name] = []
      }
      categoryGroups[cat.name].push(cat)
    })

    // 3. 重複カテゴリを確認
    const duplicates = Object.entries(categoryGroups).filter(([_, cats]) => cats.length > 1)

    if (duplicates.length > 0) {
      console.log(`⚠️  重複カテゴリが${duplicates.length}種類見つかりました:\n`)

      for (const [name, cats] of duplicates) {
        console.log(`「${name}」: ${cats.length}件`)
        for (const cat of cats) {
          // 各カテゴリを使用している経費数を確認
          const expenseCount = await prisma.expense.count({
            where: { category: name }
          })
          console.log(`  - ID: ${cat.id.substring(0, 10)}... (所有者: ${cat.masterUser.email}, 経費数: ${expenseCount})`)
        }
      }
      console.log()

      // 4. 重複を削除（最初の1つを残す）
      let deletedCount = 0

      for (const [name, cats] of duplicates) {
        // 最初の1つを保持、残りを削除
        const keepCategory = cats[0]
        const deleteCategories = cats.slice(1)

        console.log(`「${name}」の重複を処理中...`)
        console.log(`  保持: ID ${keepCategory.id.substring(0, 10)}... (${keepCategory.masterUser.email})`)

        for (const catToDelete of deleteCategories) {
          await prisma.category.delete({
            where: { id: catToDelete.id }
          })
          deletedCount++
          console.log(`  削除: ID ${catToDelete.id.substring(0, 10)}... (${catToDelete.masterUser.email})`)
        }
      }

      console.log(`\n✅ ${deletedCount}件の重複カテゴリを削除しました\n`)
    } else {
      console.log('✅ 重複カテゴリはありません\n')
    }

    // 5. 残ったカテゴリのdisplayOrderを再調整
    const remainingCategories = await prisma.category.findMany({
      orderBy: [
        { name: 'asc' }
      ]
    })

    console.log('📝 displayOrderを再調整中...\n')

    for (let i = 0; i < remainingCategories.length; i++) {
      await prisma.category.update({
        where: { id: remainingCategories[i].id },
        data: { displayOrder: i + 1 }
      })
    }

    // 6. 最終結果を表示
    const finalCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`\n=== 移行完了 ===`)
    console.log(`最終カテゴリ数: ${finalCategories.length}件\n`)
    console.log('カテゴリ一覧:')
    finalCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (表示順: ${cat.displayOrder}, 状態: ${cat.isActive ? '有効' : '無効'})`)
    })

    console.log('\n✅ グローバルカテゴリシステムへの移行が完了しました')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateToGlobalCategories()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
