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

/** Income-appropriate categories */
const incomeCategories: TransactionCategory[] = [
  'Salary', 'Savings', 'Other'
]

/** Expense-appropriate categories */
const expenseCategories: TransactionCategory[] = [
  'Groceries', 'Transport', 'Utilities', 'Entertainment',
  'Shopping', 'Health', 'Other'
]

/** ALL default categories (legacy, not used for form selection) */
export const defaultCategories: TransactionCategory[] = [
  ...expenseCategories.filter(c => c !== 'Other'),
  ...incomeCategories.filter(c => !expenseCategories.includes(c)),
  'Other'
]

/**
 * PUBLIC_INTERFACE
 * Returns income/expense-appropriate categories for the transaction type.
 */
export function getCategoriesForType(type: TransactionType): TransactionCategory[] {
  return type === "income" ? incomeCategories : expenseCategories
}
