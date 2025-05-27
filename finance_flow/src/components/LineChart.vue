<!--
LineChart.vue
Reusable, reactive line chart component for transaction trend visualization.
-->

<script setup lang="ts">
import { ref, watch, onMounted, defineProps } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  CategoryScale,
  Legend
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale, Legend)

const props = defineProps<{
  series: { label: string, data: number[], color?: string }[]
  labels: string[]
  title?: string
}>()

let chartInstance: Chart | null = null
const canvasRef = ref<HTMLCanvasElement | null>(null)

function renderChart() {
  if (!canvasRef.value || !props.series) return
  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.series.map((s, idx) => ({
        label: s.label,
        data: s.data,
        borderColor: s.color || ['#6C3EFF', '#E94242', '#22BB66'][idx % 3],
        backgroundColor: s.color || ['#e8e1ff', '#fccad2', '#cdf7e2'][idx % 3],
        fill: false,
        tension: 0.13,
        pointRadius: 3
      }))
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' },
        title: props.title
          ? {
            display: true,
            text: props.title,
            font: { size: 17 }
          }
          : { display: false }
      },
      elements: {
        line: { borderWidth: 2 }
      }
    }
  })
}

watch(() => [props.series, props.labels], () => renderChart(), { deep: true })
onMounted(() => { renderChart() })
</script>

<template>
  <div style="width:100%;max-width:440px;margin:auto;">
    <canvas ref="canvasRef" aria-label="Transaction Trend Line Chart" />
  </div>
</template>
