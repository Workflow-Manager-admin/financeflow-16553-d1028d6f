<!--
PieChart.vue
Reusable, reactive pie/doughnut chart for visualizing expenses by category.
-->

<script setup lang="ts">
import { ref, watch, onMounted, defineProps } from 'vue'
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  DoughnutController
} from 'chart.js'

Chart.register(ArcElement, Tooltip, Legend, Title, DoughnutController)

const props = defineProps<{
  data: Record<string, number>
  colors?: string[]
  title?: string
}>()

let chartInstance: Chart | null = null
const canvasRef = ref<HTMLCanvasElement | null>(null)

function renderChart() {
  if (!canvasRef.value || !props.data) return

  const labels = Object.keys(props.data)
  const dataset = Object.values(props.data)
  // Pie color palette fallback:
  const colorPalette = props.colors || [
    "#6C3EFF", "#e9446e", "#22bb66", "#fdc143",
    "#f58b57", "#3c6eb4", "#8872e6", "#b8b8b8"
  ]
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: dataset,
        backgroundColor: labels.map((l, idx) => colorPalette[idx % colorPalette.length]),
        borderWidth: 1.8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
        title: props.title
          ? {
              display: true,
              text: props.title,
              font: { size: 17 }
            }
          : { display: false }
      }
    }
  })
}

watch(() => props.data, () => renderChart(), { deep: true })
onMounted(() => { renderChart() })
</script>

<template>
  <div style="width:100%;max-width:340px;margin:auto;">
    <canvas ref="canvasRef" aria-label="Expenses by Category Pie Chart" />
  </div>
</template>
