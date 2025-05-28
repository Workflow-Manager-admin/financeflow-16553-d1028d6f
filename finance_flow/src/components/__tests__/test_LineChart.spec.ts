import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LineChart from '../LineChart.vue'

describe('LineChart', () => {
  it('renders a canvas and handles props', () => {
    const labels = ['Day1', 'Day2']
    const series = [
      { label: 'Income', data: [10, 20], color: '#222' },
      { label: 'Expense', data: [2, 3], color: '#aaa' }
    ]
    const wrapper = mount(LineChart, { props: { labels, series, title: 'Trend' } })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('updates chart on data prop change', async () => {
    const labels = ['Jan', 'Feb']
    const wrapper = mount(LineChart, {
      props: {
        labels,
        series: [{ label: 'Income', data: [4, 6] }]
      }
    })
    await wrapper.setProps({
      series: [
        { label: 'Income', data: [7, 3] },
        { label: 'Expense', data: [1, 2] }
      ]
    })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
})
