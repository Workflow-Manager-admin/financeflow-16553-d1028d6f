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
  <div class="linechart-container">
    <canvas ref="canvasRef" aria-label="Transaction Trend Line Chart" />
  </div>
</template>

<style scoped>
.linechart-container {
  width: 100%;
  min-width: 340px;
  max-width: 770px;
  min-height: 280px;
  max-height: 500px;
  margin: 0 auto;
  padding: 1.1rem 1.5rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Make the chart much larger for desktop */
@media (min-width: 900px) {
  .linechart-container {
    max-width: 820px;
    min-height: 370px;
    padding: 2rem 2.5rem;
  }
}

/* Allow some vertical stretching for big screens */
@media (min-width: 1300px) {
  .linechart-container {
    max-width: 1100px;
    min-height: 440px;
    max-height: 670px;
    padding: 2.6rem 3.4rem;
  }
}

/* Responsive for mobile, but keep it visually larger */
@media (max-width: 700px) {
  .linechart-container {
    min-width: 96vw;
    max-width: 99vw;
    min-height: 220px;
    max-height: 330px;
    padding: 0.4rem 0.2rem 0.9rem 0.2rem;
  }
}

</style>
