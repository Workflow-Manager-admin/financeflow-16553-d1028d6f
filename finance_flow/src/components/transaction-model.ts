export type TransactionCategory =
  | 'Groceries'
  | 'Salary'
  | 'Transport'
  | 'Utilities'
  | 'Entertainment'
  | 'Savings'
  | 'Shopping'
  | 'Health'
  | 'Other'
  | string

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  category: TransactionCategory
  type: TransactionType
  amount: number
  date: string // ISO format, e.g. '2024-06-11'
  description?: string
}

export const defaultCategories: TransactionCategory[] = [
  'Groceries', 'Salary', 'Transport', 'Utilities', 'Entertainment',
  'Savings', 'Shopping', 'Health', 'Other'
]
