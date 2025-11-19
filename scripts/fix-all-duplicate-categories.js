const { PrismaClient } = require('@prisma/client')

async function fixAllDuplicateCategories() {
  const prisma = new PrismaClient()
  try {
    console.log('全カテゴリを確認中...\n')

    // すべてのカテゴリを取得
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`合計 ${categories.length} 件のカテゴリが見つかりました\n`)

    // カテゴリ名でグループ化
    const categoryGroups = {}
    categories.forEach(cat => {
      if (!categoryGroups[cat.name]) {
        categoryGroups[cat.name] = []
      }
      categoryGroups[cat.name].push(cat)
    })

    // 重複があるカテゴリを確認
    const duplicates = Object.entries(categoryGroups).filter(([name, cats]) => cats.length > 1)

    if (duplicates.length === 0) {
      console.log('✓ 重複カテゴリはありません')
      return
    }

    console.log(`⚠️ ${duplicates.length} 種類のカテゴリに重複があります:\n`)

    for (const [name, cats] of duplicates) {
      console.log(`"${name}": ${cats.length}件`)
      cats.forEach((cat, index) => {
        console.log(`  ${index + 1}. ID: ${cat.id}, 表示順: ${cat.displayOrder}`)
      })
      console.log()
    }

    // 重複を削除
    let totalDeleted = 0
    let totalExpensesUpdated = 0

    for (const [name, cats] of duplicates) {
      console.log(`\n"${name}" の重複を処理中...`)

      // 最初の1つを残して、残りを削除
      const keepCategory = cats[0]
      const deleteCategories = cats.slice(1)

      console.log(`  保持: ID ${keepCategory.id}`)
      console.log(`  削除: ${deleteCategories.length}件`)

      for (const catToDelete of deleteCategories) {
        // このカテゴリを使用している経費があるか確認
        const expensesCount = await prisma.expense.count({
          where: { category: catToDelete.name }
        })

        if (expensesCount > 0) {
          console.log(`    - ID ${catToDelete.id}: ${expensesCount}件の経費あり（カテゴリ名同じなので問題なし）`)
          totalExpensesUpdated += expensesCount
        }

        // カテゴリを削除
        await prisma.category.delete({
          where: { id: catToDelete.id }
        })

        totalDeleted++
      }

      console.log(`  ✓ "${name}" の処理完了`)
    }

    console.log(`\n=== 処理結果 ===`)
    console.log(`削除したカテゴリ: ${totalDeleted}件`)
    console.log(`影響を受けた経費: ${totalExpensesUpdated}件（カテゴリ名は変更なし）`)

    // 修正後のカテゴリ一覧を表示
    const updatedCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`\n修正後のカテゴリ一覧（${updatedCategories.length}件）:`)
    updatedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, 表示順: ${cat.displayOrder})`)
    })

    console.log('\n✅ すべての重複カテゴリを削除しました')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllDuplicateCategories()
