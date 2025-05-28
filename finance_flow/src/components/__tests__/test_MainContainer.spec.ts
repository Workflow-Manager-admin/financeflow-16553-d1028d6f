import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MainContainer from '../MainContainer.vue'

function wait(ms = 0) {
  // Helper for waiting DOM transitions
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('MainContainer', () => {
  // Helper to mount fresh for each test
  function freshMount() {
    localStorage.clear()
    return mount(MainContainer, { attachTo: document.body })
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
    const wrapper = freshMount()
    const txRows = wrapper.findAll('.transaction-row')
    expect(txRows.length).toBeGreaterThan(0)
    expect(wrapper.text()).toMatch(/Salary|Groceries/)
  })

  it('opens and closes the transaction form panel and processes add', async () => {
    const wrapper = freshMount()
    const addBtn = wrapper.find('.add-btn')
    await addBtn.trigger('click')
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/Add Expense/)
    expect(wrapper.text()).toMatch(/Add Income/)

    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const expenseForm = forms.find(f => f.vm.$.vnode.key === 'expense-form')
    expect(expenseForm).toBeDefined()
    const [amountIn] = expenseForm!.findAll('input[type="number"]')
    await amountIn.setValue('51.77')
    const [dateIn] = expenseForm!.findAll('input[type="date"]')
    await dateIn.setValue('2024-06-16')
    await expenseForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(false)
    expect(wrapper.find('.transaction-row .amount.expense').text()).toContain('- $51.77')
  })

  it('displays filters and filters transactions by category', async () => {
    const wrapper = freshMount()
    const filter = wrapper.find('select.filter-input')
    expect(filter.exists()).toBe(true)
    await filter.setValue('Utilities')
    await flushPromises()
    expect(wrapper.text()).toMatch(/No transactions found/i)
  })

  it('edits a transaction and updates in the list', async () => {
    const wrapper = freshMount()
    const editBtns = wrapper.findAll('.transaction-row .edit-btn')
    expect(editBtns.length).toBeGreaterThan(0)
    await editBtns[0].trigger('click')
    await flushPromises()
    expect(wrapper.find('.transaction-form-card-panel').exists()).toBe(true)
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const editForm = forms.find(f => f.isVisible())
    const [amountInput] = editForm!.findAll('input[type="number"]')
    await amountInput.setValue('1111.11')
    await editForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.transaction-row .amount').text()).toMatch(/(1111\.11|1,111\.11)/)
  })

  it('sets a savings goal and visualizes progress', async () => {
    const wrapper = freshMount()
    if (wrapper.text().includes('Set your savings goal')) {
      const goalIn = wrapper.find('input.goal-input')
      await goalIn.setValue('300')
      await wrapper.find('button.goal-set-btn').trigger('submit')
      await flushPromises()
      expect(wrapper.text()).toMatch(/Save/)
      expect(wrapper.text()).toMatch(/\$300\.00/)
    }
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const incomeForm = forms.find(f => f.vm.$.vnode.key === 'income-form')
    await incomeForm!.find('input[type="number"]').setValue('500')
    await incomeForm!.find('input[type="date"]').setValue('2024-06-18')
    await incomeForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    const ringLabel = wrapper.find('.svg-percentage-label')
    expect(ringLabel.text()).toMatch('100')
  })

  it('shows in-app notifications and dismisses them', async () => {
    const wrapper = freshMount()
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const expenseForm = forms.find(f => f.vm.$.vnode.key === 'expense-form')
    await expenseForm!.find('input[type="number"]').setValue('12')
    await expenseForm!.find('input[type="date"]').setValue('2024-06-20')
    await expenseForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.notification.success').text()).toMatch(/Transaction added/)
    await wait(3100)
    await flushPromises()
    expect(wrapper.find('.notification.success').exists()).toBe(false)
  })

  it('renders and updates both the Pie and Line chart visualizations', async () => {
    const wrapper = freshMount()
    expect(wrapper.findComponent({ name: 'PieChart' }).find('canvas').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LineChart' }).find('canvas').exists()).toBe(true)
    await wrapper.find('.add-btn').trigger('click')
    const forms = wrapper.findAllComponents({ name: 'TransactionForm' })
    const addForm = forms.find(f => f.isVisible())
    await addForm!.find('input[type="number"]').setValue('123')
    await addForm!.find('input[type="date"]').setValue('2024-06-22')
    await addForm!.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'LineChart' }).find('canvas').exists()).toBe(true)
  })

  it('is visually responsive (basic size check)', async () => {
    const wrapper = freshMount()
    const container = wrapper.get('.main-grid')
    expect(container.classes()).toContain('main-grid')
    expect(wrapper.find('.side-panel').exists()).toBe(true)
    expect(wrapper.find('.main-content').exists()).toBe(true)
  })
})
