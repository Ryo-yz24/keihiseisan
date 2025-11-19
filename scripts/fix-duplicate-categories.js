const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDuplicateCategories() {
  try {
    console.log('カテゴリを確認中...')

    // すべてのカテゴリを取得
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log('\n現在のカテゴリ一覧:')
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id}, 名前: "${cat.name}", 表示順: ${cat.displayOrder}`)
    })

    // 「交通費」カテゴリを検索
    const transportCategories = categories.filter(cat =>
      cat.name.includes('交通費')
    )

    if (transportCategories.length > 1) {
      console.log(`\n⚠️ 交通費カテゴリが${transportCategories.length}件見つかりました:`)
      transportCategories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ID: ${cat.id}, 名前: "${cat.name}"`)
      })

      // 「交通費交通費」を削除
      const duplicateCategory = transportCategories.find(cat => cat.name === '交通費交通費')
      if (duplicateCategory) {
        console.log(`\n"交通費交通費" (ID: ${duplicateCategory.id}) を削除します...`)

        // このカテゴリを使用している経費があるか確認
        const expensesUsingCategory = await prisma.expense.count({
          where: { category: duplicateCategory.name }
        })

        if (expensesUsingCategory > 0) {
          console.log(`⚠️ このカテゴリを使用している経費が${expensesUsingCategory}件あります`)
          console.log(`これらの経費のカテゴリを「交通費」に変更します...`)

          await prisma.expense.updateMany({
            where: { category: duplicateCategory.name },
            data: { category: '交通費' }
          })

          console.log('✓ 経費のカテゴリを更新しました')
        }

        // カテゴリを削除
        await prisma.category.delete({
          where: { id: duplicateCategory.id }
        })

        console.log('✓ 重複カテゴリを削除しました')
      }

      // 「交通費」が2つある場合は、1つを削除
      const normalTransportCategories = transportCategories.filter(cat => cat.name === '交通費')
      if (normalTransportCategories.length > 1) {
        console.log(`\n"交通費"カテゴリが${normalTransportCategories.length}件あります`)

        // 最初の1つを残して、残りを削除
        for (let i = 1; i < normalTransportCategories.length; i++) {
          const catToDelete = normalTransportCategories[i]
          console.log(`"交通費" (ID: ${catToDelete.id}) を削除します...`)

          // このカテゴリを使用している経費を最初のカテゴリに移行
          const expensesCount = await prisma.expense.count({
            where: { category: catToDelete.name }
          })

          if (expensesCount > 0) {
            console.log(`  ${expensesCount}件の経費を保持します（カテゴリ名は同じなので変更不要）`)
          }

          await prisma.category.delete({
            where: { id: catToDelete.id }
          })

          console.log('  ✓ 削除完了')
        }
      }
    } else if (transportCategories.length === 1) {
      console.log('\n✓ 交通費カテゴリは1件のみです（問題なし）')
    } else {
      console.log('\n⚠️ 交通費カテゴリが見つかりません')
    }

    // 修正後のカテゴリ一覧を表示
    const updatedCategories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log('\n修正後のカテゴリ一覧:')
    updatedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id}, 名前: "${cat.name}", 表示順: ${cat.displayOrder}`)
    })

    console.log('\n✅ 完了しました')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateCategories()
