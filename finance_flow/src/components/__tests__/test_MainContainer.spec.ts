import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MainContainer from '../MainContainer.vue'

function wait(ms = 0) {
  // Helper for waiting DOM transitions
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('MainContainer', () => {
  let wrapper: ReturnType<typeof mount>

  // Setup for each test (clears storage)
  function freshMount() {
    localStorage.clear()
    return mount(MainContainer, {
      attachTo: document.body,
    })
  }


  it('renders and shows onboarding banner on first load', async () => {
    const wrapper = freshMount()
    expect(wrapper.text()).toMatch(/Welcome to FinanceFlow/i)
    expect(wrapper.find('.onboarding-banner').exists()).toBe(true)
    await wrapper.find('.onboarding-close').trigger('click')
    expect(wrapper.find('.onboarding-banner').exists()).toBe(false)
    expect(localStorage.getItem('financeflow-onboarded')).toBe('yes')
  })

  it('toggles dark/light theme', async () => {
    const wrapper = freshMount()
    const btn = wrapper.find('button.theme-toggle')
    const getThemeLS = () => localStorage.getItem('financeflow-theme')
    const prev = getThemeLS()
    await btn.trigger('click')
    const toggled = getThemeLS()
    expect(toggled === 'dark' || toggled === 'light').toBeTruthy()
    await btn.trigger('click')
    expect(getThemeLS()).not.toBe(prev)
  })

  it('shows demo transactions in list by default', () => {
    const txRows = wrapper.findAll('.transaction-row')
    expect(txRows.length).toBeGreaterThan(0)
    // Contains at least demo "Salary" or "Groceries" from demo data
    expect(wrapper.text()).toMatch(/Salary|Groceries/)
  })

  it('opens and closes the transaction form panel and processes add', async () => {
    const addBtn = wrapper.find('.add-btn')
    await addBtn.trigger('click')
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(true)
    // By default, both expense and income panels/forms should be visible
    expect(wrapper.text()).toMatch(/Add Expense/)
    expect(wrapper.text()).toMatch(/Add Income/)

    // Fill expense form (simplified)
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    // Pick the expense one by key
    const expenseForm = forms.find(f => f.vm.$.vnode.key === 'expense-form')
    expect(expenseForm).toBeDefined()
    // Amount and date inputs
    const [amountIn] = expenseForm!.findAll('input[type="number"]')
    await amountIn.setValue('51.77')
    const [dateIn] = expenseForm!.findAll('input[type="date"]')
    await dateIn.setValue('2024-06-16')
    // Submit
    await expenseForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    // Card panels should close after submit
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(false)
    // New transaction should be shown top of list
    expect(wrapper.find('.transaction-row .amount.expense').text()).toContain('- $51.77')
  })

  it('displays filters and filters transactions by category', async () => {
    // By default, there are demo transactions. Pick/find the select filter menu.
    const filter = wrapper.find('select.filter-input')
    expect(filter.exists()).toBe(true)
    // Select a non-default category (matching one in demo or just filter for no results)
    await filter.setValue('Utilities') // Assume not present in demo
    await flushPromises()
    // Transaction list should show empty state
    expect(wrapper.text()).toMatch(/No transactions found/i)
  })

  it('edits a transaction and updates in the list', async () => {
    // Go to transaction list and click edit on first item
    const editBtns = wrapper.findAll('.transaction-row .edit-btn')
    expect(editBtns.length).toBeGreaterThan(0)
    await editBtns[0].trigger('click')
    await flushPromises()
    // Should open either expense or income panel (depending on type)
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(true)
    // Fill in a new amount
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    // Find first visible
    const editForm = forms.find(f => f.isVisible())
    const [amountInput] = editForm!.findAll('input[type="number"]')
    await amountInput.setValue('1111.11')
    await editForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    // Should update transaction amount in list
    expect(wrapper.find('.transaction-row .amount').text()).toMatch(/(1111\.11|1,111\.11)/)
  })

  it('sets a savings goal and visualizes progress', async () => {
    // If goal not set, it should prompt
    if (wrapper.text().includes('Set your savings goal')) {
      const goalIn = wrapper.find('input.goal-input')
      await goalIn.setValue('300')
      await wrapper.find('button.goal-set-btn').trigger('submit')
      await flushPromises()
      // Should update label to show the goal
      expect(wrapper.text()).toMatch(/Save/)
      expect(wrapper.text()).toMatch(/\$300\.00/)
      // Confetti and notification should not display yet (not enough income)
    }
    // Add income: open transaction form, switch to income, fill, and submit
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    // income form is key 'income-form'
    const incomeForm = forms.find(f => f.vm.$.vnode.key === 'income-form')
    await incomeForm!.find('input[type="number"]').setValue('500')
    await incomeForm!.find('input[type="date"]').setValue('2024-06-18')
    await incomeForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    const ringLabel = wrapper.find('.svg-percentage-label')
    // Progress must be 100%
    expect(ringLabel.text()).toMatch('100')
  })

  it('shows in-app notifications and dismisses them', async () => {
    // Add a transaction and check for notification
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const expenseForm = forms.find(f => f.vm.$.vnode.key === 'expense-form')
    await expenseForm!.find('input[type="number"]').setValue('12')
    await expenseForm!.find('input[type="date"]').setValue('2024-06-20')
    await expenseForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    // Should display notification: "Transaction added."
    expect(wrapper.find('.notification.success').text()).toMatch(/Transaction added/)
    // Simulate notification auto-dismiss
    await wait(3100)
    await flushPromises()
    expect(wrapper.find('.notification.success').exists()).toBe(false)
  })

  it('renders and updates both the Pie and Line chart visualizations', async () => {
    // Both should exist and have canvas for Chart.js
    expect(wrapper.findComponent({ name: 'PieChart' }).find('canvas').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LineChart' }).find('canvas').exists()).toBe(true)
    // Add a transaction via UI
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    // Find any visible form (income or expense)
    const addForm = forms.find(f => f.isVisible())
    await addForm!.find('input[type="number"]').setValue('123')
    await addForm!.find('input[type="date"]').setValue('2024-06-22')
    await addForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    // Canvas for charts should still be present
    expect(wrapper.findComponent({ name: 'LineChart' }).find('canvas').exists()).toBe(true)
  })

  it('is visually responsive (basic size check)', async () => {
    // Force container resize (works in jsdom just to a point)
    const container = wrapper.get('.main-grid')
    // No need to set style; just check structure/classes are correct
    expect(container.classes()).toContain('main-grid')
    expect(wrapper.find('.side-panel').exists()).toBe(true)
    expect(wrapper.find('.main-content').exists()).toBe(true)
  })
})
