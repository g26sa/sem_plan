import { db } from '../db'

async function getDescendantCategoryIds(rootId: number) {
  const cats = await db.categories.toArray()
  const byParent = new Map<number | null | undefined, number[]>()
  for (const c of cats) {
    const p = c.parentId ?? null
    const list = byParent.get(p) ?? []
    if (c.id != null) list.push(c.id)
    byParent.set(p, list)
  }

  const result: number[] = []
  const seen = new Set<number>()
  const stack = [rootId]
  while (stack.length) {
    const cur = stack.pop()!
    if (!seen.has(cur)) {
      seen.add(cur)
      result.push(cur)
    }
    const children = byParent.get(cur) ?? []
    for (const ch of children) stack.push(ch)
  }
  return result
}

export async function deleteCategoryCascade(categoryId: number) {
  const ids = await getDescendantCategoryIds(categoryId)
  await db.transaction('rw', db.categories, db.transactions, db.budgets, db.goals, async () => {
    await db.transactions.where('categoryId').anyOf(ids).delete()
    await db.budgets.where('categoryId').anyOf(ids).delete()
    await db.goals.where('categoryId').anyOf(ids).delete()
    await db.categories.bulkDelete(ids)
  })
}

export async function deleteAccountCascade(accountId: number) {
  await db.transaction('rw', db.accounts, db.transactions, async () => {
    await db.transactions.where('accountId').equals(accountId).delete()
    await db.accounts.delete(accountId)
  })
}

