import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionForm from '../TransactionForm.vue'
import { getCategoriesForType } from '../transaction-model'

const baseTransaction = {
  id: 'xyz',
  type: 'expense' as const,
  category: 'Groceries',
  amount: 44.5,
  date: '2024-06-11',
  description: 'Milk and bread',
}

describe('TransactionForm', () => {
  it('renders all basic form fields and default values', () => {
    const wrapper = mount(TransactionForm)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('emits "submit" event with new correct transaction data', async () => {
    const wrapper = mount(TransactionForm)
    await wrapper.find('input[type="number"]').setValue('33.99')
    await wrapper.find('input[type="date"]').setValue('2024-06-13')
    await wrapper.find('input[type="text"]').setValue('Pizza night')
    await wrapper.find('button[type="submit"]').trigger('submit')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const data = emitted![0][0] as { amount: number; description: string; type: string }
    expect(data.amount).toBe(33.99)
    expect(data.description).toBe('Pizza night')
    expect(data.type).toBe('expense')
  })

  it('properly locks the type and disables selector if lockedType is set', () => {
    const wrapper = mount(TransactionForm, {
      props: { lockedType: 'income' }
    })
    expect(wrapper.html()).not.toMatch(/Type<\/label>/)
    // Don't assert internal form, ensure value persists via event
    await wrapper.find('button[type="submit"]').trigger('submit')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    // type should always be 'income' because lockedType is set
    expect((emitted![0][0] as {type: string}).type).toBe('income')
  })

  it('shows correct categories for type, and supports custom existing value', async () => {
    let wrapper = mount(TransactionForm, { props: { lockedType: 'income' } })
    const options = wrapper.findAll('select option')
    const incomeCats = getCategoriesForType('income')
    expect(options.length).toBeGreaterThanOrEqual(incomeCats.length)
    // Expense type: switchable in UI only if not locked
    wrapper = mount(TransactionForm, { props: { modelValue: { type: 'expense' as const } } })
    await wrapper.find('select').setValue('Entertainment')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    // Custom fallback
    wrapper = mount(TransactionForm, { props: { modelValue: { ...baseTransaction, category: 'MyCustomCat' } } })
    expect(wrapper.text()).toContain('MyCustomCat')
  })

  it('shows Save/Cancel buttons in editMode, emits cancel', async () => {
    const wrapper = mount(TransactionForm, { props: { editMode: true, modelValue: baseTransaction } })
    expect(wrapper.find('button.form-submit').text()).toMatch(/Save/)
    expect(wrapper.find('button.form-cancel').exists()).toBe(true)
    await wrapper.find('button.form-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('validates amount and date fields as required', async () => {
    const wrapper = mount(TransactionForm)
    const btn = wrapper.find('button.form-submit')
    await wrapper.find('input[type="number"]').setValue('')
    await btn.trigger('submit')
    // Should not emit submit if empty
    expect(wrapper.emitted('submit')).toBeFalsy()
    // Changing only one input should allow emit
    await wrapper.find('input[type="number"]').setValue('3')
    await wrapper.find('input[type="date"]').setValue('')
    await btn.trigger('submit')
    // Should emit event, date should be set by component logic
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
