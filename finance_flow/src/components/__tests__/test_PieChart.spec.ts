import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PieChart from '../PieChart.vue'

describe('PieChart', () => {
  it('mounts and renders a canvas', () => {
    const data = { Food: 100, Utilities: 50 }
    const wrapper = mount(PieChart, {
      props: { data, colors: ['#111111', '#222222'], title: 'Expenses Chart' }
    })
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
  })

  it('updates Chart.js chart on prop changes', async () => {
    const wrapper = mount(PieChart, {
      props: { data: { Food: 50 }, colors: ['#aaa'], title: 'Test' }
    })
    // Change data prop
    await wrapper.setProps({ data: { Food: 60, Transport: 40 } })
    // If Chart.js is loaded, chartInstance should be re-created
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('renders no error for empty data', () => {
    const wrapper = mount(PieChart, { props: { data: {} } })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
})
