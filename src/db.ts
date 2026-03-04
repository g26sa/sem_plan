import Dexie, { type Table } from 'dexie'

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface FamilyMember {
  id?: number
  name: string
  role: string
}

export interface Account {
  id?: number
  name: string
  type: 'cash' | 'card' | 'deposit' | 'other'
  currency: string
  initialBalance: number
  ownerId?: number
}

export interface Category {
  id?: number
  name: string
  type: 'income' | 'expense'
  parentId?: number | null
}

export interface Transaction {
  id?: number
  date: string
  accountId: number
  categoryId: number
  memberId?: number
  amount: number
  type: TransactionType
  description?: string
  counterparty?: string
  isPlanned?: boolean
}

export interface Budget {
  id?: number
  categoryId: number
  amountPerMonth: number
}

export interface Goal {
  id?: number
  name: string
  targetAmount: number
  currentAmount: number
  dueDate?: string
  categoryId?: number
}

export class FamilyFinanceDB extends Dexie {
  members!: Table<FamilyMember, number>
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  budgets!: Table<Budget, number>
  goals!: Table<Goal, number>

  constructor() {
    super('familyFinanceDB')

    this.version(1).stores({
      members: '++id, name, role',
      accounts: '++id, name, type, ownerId',
      categories: '++id, name, type, parentId',
      transactions: '++id, date, accountId, categoryId, type',
      budgets: '++id, categoryId',
      goals: '++id, name, dueDate, categoryId',
    })

    this.version(2).stores({
      members: '++id, name, role',
      accounts: '++id, name, type, ownerId',
      categories: '++id, name, type, parentId',
      transactions: '++id, date, accountId, categoryId, type, memberId',
      budgets: '++id, categoryId',
      goals: '++id, name, dueDate, categoryId',
    })
  }
}

export const db = new FamilyFinanceDB()

