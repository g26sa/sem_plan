import { db, type Account, type Category, type FamilyMember } from './db'

export async function seedIfEmpty() {
  const [catCount, accCount, membersCount] = await Promise.all([
    db.categories.count(),
    db.accounts.count(),
    db.members.count(),
  ])

  if (membersCount === 0) {
    const members: FamilyMember[] = [
      { name: 'Семья', role: 'общий' },
      { name: 'Мама', role: 'взрослый' },
      { name: 'Папа', role: 'взрослый' },
      { name: 'Ребёнок', role: 'ребёнок' },
    ]
    await db.members.bulkAdd(members)
  }

  if (accCount === 0) {
    const accounts: Account[] = [
      { name: 'Наличные', type: 'cash', currency: 'RUB', initialBalance: 0 },
      { name: 'Карта', type: 'card', currency: 'RUB', initialBalance: 0 },
    ]
    await db.accounts.bulkAdd(accounts)
  }

  if (catCount === 0) {
    await db.transaction('rw', db.categories, async () => {
      const incomeRootId = await db.categories.add({
        name: 'Доходы',
        type: 'income',
        parentId: null,
      })
      const expenseRootId = await db.categories.add({
        name: 'Расходы',
        type: 'expense',
        parentId: null,
      })

      const categories: Category[] = [
        { name: 'Зарплата', type: 'income', parentId: incomeRootId },
        { name: 'Подработки', type: 'income', parentId: incomeRootId },

        { name: 'Продукты', type: 'expense', parentId: expenseRootId },
        { name: 'Кафе/доставка', type: 'expense', parentId: expenseRootId },
        { name: 'Транспорт', type: 'expense', parentId: expenseRootId },
        { name: 'Коммунальные', type: 'expense', parentId: expenseRootId },
        { name: 'Связь/интернет', type: 'expense', parentId: expenseRootId },
        { name: 'Здоровье', type: 'expense', parentId: expenseRootId },
        { name: 'Дети', type: 'expense', parentId: expenseRootId },
        { name: 'Развлечения', type: 'expense', parentId: expenseRootId },
        { name: 'Одежда', type: 'expense', parentId: expenseRootId },
        { name: 'Подарки', type: 'expense', parentId: expenseRootId },
      ]
      await db.categories.bulkAdd(categories)
    })
  }
}

