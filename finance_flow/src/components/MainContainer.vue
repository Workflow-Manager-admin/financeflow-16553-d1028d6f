<template>
  <div :class="['financeflow-main', { dark: isDarkMode }]">
    <!-- Confetti Celebrate Modal -->
    <ConfettiModal :visible="showConfetti" @close="closeConfettiModal" />

    <!-- Onboarding Modal/Banner -->
    <transition name="fade">
      <div v-if="showOnboarding" class="onboarding-banner">
        <span>Welcome to FinanceFlow! Begin by adding your first transaction or setting a savings goal.</span>
        <button class="onboarding-close" @click="closeOnboarding">Got it</button>
      </div>
    </transition>

    <!-- Notifications -->
    <transition-group name="notif-fade" tag="div" class="notifications">
      <!-- Only show the first notification in the array, if any -->
      <div
        v-if="notifications.length"
        :key="notifications[0].id"
        :class="['notification', notifications[0].type]"
      >
        {{ notifications[0].message }}
      </div>
    </transition-group>

    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" :aria-label="'Switch to ' + (isDarkMode ? 'light' : 'dark') + ' mode'">
      <svg v-if="!isDarkMode" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#6C3EFF"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 19.07l-1.41 1.41M17.66 19.07l-1.41-1.41M6.34 4.93L4.93 6.34" stroke="#6C3EFF" stroke-width="2" stroke-linecap="round"/></svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#6C3EFF"/></svg>
    </button>

    <div class="main-grid">
      <!-- Sidebar: Savings Goal and Progress Ring -->
      <aside class="side-panel">
        <div class="savings-goal-card card">
          <div class="ring-placeholder mini-ring">
            <div class="svg-ring-outer">
              <svg width="74" height="74" class="svg-ring">
                <circle
                  cx="37"
                  cy="37"
                  r="30"
                  stroke="#E0E0E0"
                  stroke-width="8"
                  fill="none"
                />
                <circle
                  cx="37"
                  cy="37"
                  r="30"
                  :stroke="isGoalMet ? '#22bb66' : (goalProgress >= 75 ? '#fdc143' : '#6C3EFF')"
                  stroke-width="8"
                  fill="none"
                  :stroke-dasharray="2*Math.PI*30"
                  :stroke-dashoffset="2*Math.PI*30 - (2*Math.PI*30*goalProgress/100)"
                  style="transition: stroke-dashoffset 1s cubic-bezier(.66,.01,.68,1.05), stroke 0.7s;"
                  stroke-linecap="round"
                />
                <!-- Perfectly centered percentage label inside the SVG ring -->
                <text
                  x="37"
                  y="37"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="svg-percentage-label"
                >{{ goalProgress }}%</text>
                <text
                  x="37"
                  y="50"
                  text-anchor="middle"
                  class="svg-goal-label"
                  style="font-size: 0.72em; fill: #5c4ec9;"
                >Goal</text>
              </svg>
            </div>
          </div>
          <div class="goal-desc mini-goal-desc goal-inline-summary">
            <template v-if="savingsGoal > 0">
              <span class="goal-inline-label">Save</span>
              <span class="goal-inline-value">${{ savingsGoal.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
              <span v-if="goalAccumulated > 0" class="goal-inline-left">{{ accLeftText }}</span>
            </template>
            <template v-else>
              <span class="goal-inline-placeholder">Set your savings goal!</span>
            </template>
          </div>
          <form
            @submit.prevent="setSavingsGoal"
            class="goal-form compact"
            v-if="!editingGoal && !savingsGoal"
          >
            <input
              v-model.number="goalInput"
              type="number"
              min="1"
              step="0.01"
              placeholder="Goal ($)"
              class="goal-input mini-input big-placeholder"
              required
            />
            <button
              class="goal-set-btn mini-goal-set-btn"
              type="submit"
              :disabled="!goalInput || goalInput <= 0"
              aria-label="Set Goal"
            >Set</button>
          </form>
          <template v-if="savingsGoal">
            <button
              class="mini-edit-goal-btn"
              @click="editingGoal = true"
              title="Edit goal"
              v-if="!editingGoal"
            >✎ Edit goal</button>
            <form
              v-if="editingGoal"
              class="goal-form compact savings-edit-form"
              @submit.prevent="setSavingsGoal"
            >
              <div class="goal-edit-input-wrap">
                <input
                  v-model.number="goalInput"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="New goal ($)"
                  class="goal-input mini-input big-placeholder"
                  required
                />
              </div>
              <div class="goal-edit-actions">
                <button
                  type="submit"
                  class="goal-set-btn mini-goal-set-btn"
                  :disabled="!goalInput || goalInput <= 0"
                >Save</button>
                <button
                  type="button"
                  class="goal-cancel-btn mini-goal-cancel-btn"
                  @click="cancelGoalEdit"
                >Cancel</button>
              </div>
            </form>
          </template>
        </div>
        <div class="side-spacer"></div>
      </aside>

      <!-- Main Content -->
      <section class="main-content">
        <!-- Transaction Manager -->
        <div class="transact-filter-row">
          <div class="transaction-manager card">
            <div class="section-title">Transactions</div>
            <div class="transaction-controls">
              <button class="add-btn" @click="toggleTransactionForm">{{ transactionFormOpen ? 'Close' : '+ Add' }}</button>
              <div class="filters">
                <input type="date" class="filter-input" v-model="filter.startDate"/>
                <input type="date" class="filter-input" v-model="filter.endDate"/>
                <select class="filter-input" v-model="filter.category">
                  <option value="">All Categories</option>
                  <option v-for="cat in categories" :key="cat">{{ cat }}</option>
                </select>
              </div>
            </div>

            <transition name="fade">
              <div
                v-if="transactionFormOpen"
                class="transaction-form-card-panel"
                style="margin-bottom:1.2rem;"
              >
                <!-- Modern card/panel look, clearly separated: split as two panels, one for expense and one for income -->
                <div class="add-transaction-section-cards">
                  <!-- Expense panel -->
                  <div class="card transaction-add-card expense-add-card">
                    <div class="add-type-title">Add Expense</div>
                    <TransactionForm
                      :editMode="!!editIndex && transactions[editIndex]?.type === 'expense'"
                      :modelValue="editIndex !== null && editIndex >= 0 && transactions[editIndex]?.type === 'expense'
                        ? transactions[editIndex]
                        : { type: 'expense' }"
                      lockedType="expense"
                      @submit="onTransactionFormSubmit"
                      @cancel="closeTransactionForm"
                      v-show="editIndex === null || (editIndex !== null && transactions[editIndex]?.type === 'expense')"
                      key="expense-form"
                    />
                  </div>
                  <!-- Income panel -->
                  <div class="card transaction-add-card income-add-card">
                    <div class="add-type-title">Add Income</div>
                    <TransactionForm
                      :editMode="!!editIndex && transactions[editIndex]?.type === 'income'"
                      :modelValue="editIndex !== null && editIndex >= 0 && transactions[editIndex]?.type === 'income'
                        ? transactions[editIndex]
                        : { type: 'income' }"
                      lockedType="income"
                      @submit="onTransactionFormSubmit"
                      @cancel="closeTransactionForm"
                      v-show="editIndex === null || (editIndex !== null && transactions[editIndex]?.type === 'income')"
                      key="income-form"
                    />
                  </div>
                </div>
                <!-- Only the form matching the transaction type is editable when editing; both are shown when adding -->
              </div>
            </transition>

            <div class="transaction-list">
              <transition-group name="fade" tag="div">
                <div
                  v-for="(txn, idx) in filteredTransactions"
                  :key="txn.id"
                  class="transaction-row"
                  :style="{ background: selectedRow === idx ? '#f0eeff' : '' }"
                  @mouseenter="selectedRow = idx"
                  @mouseleave="selectedRow = null"
                >
                  <span class="category">{{ txn.category }}</span>
                  <span class="desc" :title="txn.description">{{ txn.description || '(No Description)' }}</span>
                  <span :class="['amount', txn.type]">
                    {{ txn.type === 'income' ? '+ ' : '- ' }}${{ txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
                  </span>
                  <span class="date">{{ txn.date }}</span>
                  <button class="edit-btn" title="Edit" @click="openEditForm(idx)">✎</button>
                </div>
              </transition-group>
              <div v-if="filteredTransactions.length === 0" class="transaction-row placeholder">
                <span>No transactions found.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Visualizations and Analytics -->
        <div class="visualizations-row">
          <div class="visualization-card card">
            <div class="section-title">Expense by Category</div>
            <PieChart
              :data="expenseCategorySummary"
              :colors="pieColors"
              title="Expenses by Category"
            />
          </div>
          <div class="visualization-card card">
            <div class="section-title">Monthly Trends</div>
            <LineChart
              :labels="trendLabels"
              :series="trendSeries"
              title="Income & Expenses Over Time"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import TransactionForm from './TransactionForm.vue'
import PieChart from './PieChart.vue'
import LineChart from './LineChart.vue'
import ConfettiModal from './ConfettiModal.vue'
import type { Transaction, TransactionCategory } from './transaction-model'
import { defaultCategories } from './transaction-model'

interface Notification {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

/** 
 * PUBLIC_INTERFACE
 * Theme & Onboarding State
 */
const isDarkMode = ref(false)
const showOnboarding = ref(false)
const notifications = ref<Notification[]>([])

// PUBLIC_INTERFACE
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  setTheme(isDarkMode.value)
  localStorage.setItem('financeflow-theme', isDarkMode.value ? 'dark' : 'light')
}

// PUBLIC_INTERFACE
function setTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.body.style.backgroundColor = dark ? '#121216' : ''
}

onMounted(() => {
  // Theme: apply setting or system default
  const themeLocal = localStorage.getItem('financeflow-theme')
  if (themeLocal) {
    isDarkMode.value = themeLocal === 'dark'
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkMode.value = true
  }
  setTheme(isDarkMode.value)

  watch(isDarkMode, val => setTheme(val), { immediate: false })

  if (!localStorage.getItem('financeflow-onboarded')) {
    showOnboarding.value = true
  }
  loadTransactions()
  // Load savings goal from local storage
  const storedGoal = localStorage.getItem('financeflow-savings-goal')
  if (storedGoal && !isNaN(Number(storedGoal))) {
    savingsGoal.value = Number(storedGoal)
  }
  goalInput.value = savingsGoal.value || null
})

function closeOnboarding() {
  showOnboarding.value = false
  localStorage.setItem('financeflow-onboarded', 'yes')
}

// Transactions
const localStorageKey = 'financeflow-transactions'

// default for demonstration:
const demoTransactions: Transaction[] = [
  {
    id: "t1",
    category: "Groceries",
    type: "expense",
    amount: 36.20,
    date: "2024-05-23",
    description: "Bought fruits"
  },
  {
    id: "t2",
    category: "Salary",
    type: "income",
    amount: 2500,
    date: "2024-05-20",
    description: "Monthly pay"
  }
]

const transactions = ref<Transaction[]>([])

/**
 * PUBLIC_INTERFACE
 * Load transactions from local storage, fallback to demo data if empty.
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(localStorageKey)
    if (raw) {
      transactions.value = JSON.parse(raw)
    } else {
      transactions.value = [...demoTransactions]
      saveTransactions()
    }
  } catch {
    transactions.value = [...demoTransactions]
  }
}

/**
 * PUBLIC_INTERFACE
 * Save transactions to local storage for persistence.
 */
function saveTransactions() {
  localStorage.setItem(localStorageKey, JSON.stringify(transactions.value))
}

/**
 * Categories list for dropdown.
 */
const categories = ref<TransactionCategory[]>([...defaultCategories])

// Transaction Form State
const transactionFormOpen = ref(false)
const editIndex = ref<number | null>(null)
const selectedRow = ref<number|null>(null)

// Transaction filter
const filter = ref({
  startDate: '',
  endDate: '',
  category: ''
})

/**
 * Pie chart color palette and logic.
 */
const pieColors = [
  "#6C3EFF", "#e9446e", "#22bb66", "#fdc143",
  "#f58b57", "#3c6eb4", "#8872e6", "#b8b8b8"
]

/**
 * PUBLIC_INTERFACE
 * Computed: summary of expense amount grouped by category.
 */
const expenseCategorySummary = computed(() => {
  const categoryMap: Record<string, number> = {}
  for (const txn of transactions.value) {
    if (txn.type === 'expense') {
      if (!categoryMap[txn.category]) categoryMap[txn.category] = 0
      categoryMap[txn.category] += txn.amount
    }
  }
  return categoryMap
})

/**
 * PUBLIC_INTERFACE
 * Computed: summarized trend for line chart (monthly or daily, income/expense).
 */
const trendLabels = computed(() => {
  const allDates = transactions.value
    .map(txn => txn.date)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
  return allDates.slice(-8)
})

const trendSeries = computed(() => {
  const labels = trendLabels.value
  const incomeSeries: number[] = []
  const expenseSeries: number[] = []
  labels.forEach(date => {
    const incomeAmt = transactions.value
      .filter(t => t.date === date && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenseAmt = transactions.value
      .filter(t => t.date === date && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    incomeSeries.push(Number(incomeAmt.toFixed(2)))
    expenseSeries.push(Number(expenseAmt.toFixed(2)))
  })
  return [
    { label: 'Income', data: incomeSeries, color: "#22bb66" },
    { label: 'Expense', data: expenseSeries, color: "#e94242" }
  ]
})

/**
 * PUBLIC_INTERFACE
 * Computed filtered transactions based on filter form.
 */
const filteredTransactions = computed(() => {
  return transactions.value.filter(txn => {
    let ok = true
    if (filter.value.category)
      ok = ok && txn.category === filter.value.category
    if (filter.value.startDate)
      ok = ok && txn.date >= filter.value.startDate
    if (filter.value.endDate)
      ok = ok && txn.date <= filter.value.endDate
    return ok
  }).sort((a, b) => b.date.localeCompare(a.date))
})

/**
 * PUBLIC_INTERFACE
 * Opens add/edit transaction form.
 */
function toggleTransactionForm() {
  if (transactionFormOpen.value) {
    closeTransactionForm()
  } else {
    transactionFormOpen.value = true
    editIndex.value = null
  }
}
function openEditForm(index: number) {
  editIndex.value = index
  transactionFormOpen.value = true
}
function closeTransactionForm() {
  transactionFormOpen.value = false
  editIndex.value = null
}

/**
 * PUBLIC_INTERFACE
 * Handles submission from add or edit.
 */
function onTransactionFormSubmit(txn: Transaction) {
  if (editIndex.value !== null && editIndex.value >= 0) {
    transactions.value[editIndex.value] = { ...txn }
    notifications.value.push({ id: Date.now(), type: "success", message: "Transaction updated." })
  } else {
    const newid = 't' + Date.now() + '-' + Math.floor(Math.random()*10000)
    transactions.value.unshift({
      ...txn,
      id: newid
    })
    notifications.value.push({ id: Date.now(), type: "success", message: "Transaction added." })
  }
  saveTransactions()
  closeTransactionForm()
}

/**
 * Notifications are shown one at a time. Each is auto-dismissed after 3 seconds.
 */
watch(
  notifications,
  (notifList) => {
    if (!notifList.length) return
    // Only start timeout for first notification (if just added)
    if (notifList.length === 1) {
      setTimeout(() => {
        // Remove the notification only if it is still the first in the list
        if (notifications.value.length && notifications.value[0].id === notifList[0].id) {
          notifications.value.shift()
        }
      }, 3000)
    }
  }
)

// ---- SAVINGS GOAL FEATURE START ----

/**
 * PUBLIC_INTERFACE
 * State for the savings goal.
 */
const savingsGoal = ref<number>(0)
const goalInput = ref<number | null>(null)
const editingGoal = ref(false)

const goalAccumulated = computed(() => {
  // Sum all "income" minus all "expense"
  let balance = 0
  transactions?.value?.forEach(t => {
    if (t.type === 'income') balance += t.amount
    else if (t.type === 'expense') balance -= t.amount
  })
  return Math.max(0, balance)
})

const accLeftText = computed(() => {
  if (!savingsGoal.value) return ""
  if (goalAccumulated.value >= savingsGoal.value) return "Goal Met!"
  return `$${(savingsGoal.value - goalAccumulated.value).toLocaleString(undefined, {minimumFractionDigits: 2})} left`
})

const goalProgress = computed(() => {
  if (!savingsGoal.value) return 0
  let pct = (goalAccumulated.value / savingsGoal.value) * 100
  pct = Math.max(0, Math.min(Math.round(pct), 100))
  return pct
})
const isGoalMet = computed(() => savingsGoal.value > 0 && goalAccumulated.value >= savingsGoal.value)

/**
 * PUBLIC_INTERFACE
 * Set or update savings goal and persist in LocalStorage.
 */
function setSavingsGoal() {
  if (goalInput.value && goalInput.value > 0) {
    savingsGoal.value = Math.round(goalInput.value * 100) / 100
    localStorage.setItem('financeflow-savings-goal', savingsGoal.value.toString())
    editingGoal.value = false
    goalInput.value = null
    notifications.value.push({
      id: Date.now(),
      type: "success",
      message: "Savings goal set!"
    })
  }
}
function cancelGoalEdit() {
  editingGoal.value = false
  goalInput.value = savingsGoal.value
}

/**
 * Show in-app notifications for savings progress milestones (75%, 100%).
 */
const notified75 = ref(false)
const notified100 = ref(false)
watch(goalProgress, (newPct) => {
  if (!savingsGoal.value) return
  if (newPct >= 100 && !notified100.value) {
    notifications.value.push({
      id: Date.now(),
      type: 'success',
      message: "🎉 Congrats, you've reached your savings goal!"
    })
    notified100.value = true
  } else if (newPct >= 75 && !notified75.value) {
    notifications.value.push({
      id: Date.now(),
      type: 'info',
      message: "Almost there! You've saved 75% of your goal."
    })
    notified75.value = true
  }
}, { immediate: true })

/** 
 * CONFETTI MODAL STATE & SINGLE-TRIGGER LOGIC
 */
const showConfetti = ref(false)
// Only show confetti once per 100% per goal value (persist marker in localStorage)
const confettiTriggerId = ref('') // this will be a string `${goal}_${YYYYMMDD}`

/**
 * Show confetti when progress hits 100% and hasn't shown yet for this goal achievement.
 */
watch([goalProgress, savingsGoal], ([pct, goal]) => {
  if (!goal) {
    notified100.value = false
    notified75.value = false
    showConfetti.value = false
    confettiTriggerId.value = ''
    return
  }
  // Only allow triggering once for a given goal (and after a reset if goal changes)
  const completedMarkerKey = `financeflow-confetti-${goal}`
  const markerValue = localStorage.getItem(completedMarkerKey)
  if (pct >= 100 && !markerValue) {
    // Show modal if not already triggered for this goal value
    showConfetti.value = true
    localStorage.setItem(completedMarkerKey, 'shown')
    // reset 75% if re-reached in new goal journey
    notified75.value = true
  } else if (pct < 100) {
    // If goal edited, allow retriggering for next achievement
    showConfetti.value = false
    // If the savings goal changed, also clear confetti for all other goals for rapid logic adjustment
    Object.keys(localStorage)
      .filter(k => k.startsWith('financeflow-confetti-'))
      .forEach(k => { 
        if (Number(k.match(/(\d+(\.\d+)?)/)?.[0]) !== goal) localStorage.removeItem(k)
      })
  }
})

function closeConfettiModal() {
  showConfetti.value = false
}

// Reset notification triggers if changing goal or going below milestones
watch([savingsGoal, goalProgress], ([goal, pct]) => {
  if (!goal) {
    notified100.value = false
    notified75.value = false
    showConfetti.value = false
    confettiTriggerId.value = ''
  } else {
    if (pct < 75) notified75.value = false
    if (pct < 100) {
      notified100.value = false
      // Can allow confetti for next achievement if user resets goal and hits 100 again
      showConfetti.value = false
    }
  }
})

onMounted(() => {
  // Theme: apply from localStorage or system preference on first mount
  const themeLocal = localStorage.getItem('financeflow-theme')
  if (themeLocal) {
    isDarkMode.value = themeLocal === 'dark'
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkMode.value = true
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  document.body.style.backgroundColor = isDarkMode.value ? '#121216' : ''
  // Save user preference on toggle
  watch(isDarkMode, val => {
    localStorage.setItem('financeflow-theme', val ? 'dark' : 'light')
    document.body.style.backgroundColor = val ? '#121216' : ''
  }, { immediate: true })

  if (!localStorage.getItem('financeflow-onboarded')) {
    showOnboarding.value = true
  }
  loadTransactions()
  // Load savings goal from local storage
  const storedGoal = localStorage.getItem('financeflow-savings-goal')
  if (storedGoal && !isNaN(Number(storedGoal))) {
    savingsGoal.value = Number(storedGoal)
  }
  goalInput.value = savingsGoal.value || null
})

// ---- SAVINGS GOAL FEATURE END ----
</script>

<style scoped>
/* Center the percentage label within the SVG ring using SVG text alignment and styled for clarity */
.svg-ring-outer {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 74px;
  height: 74px;
}
.svg-ring {
  display: block;
  width: 74px;
  height: 74px;
}
.svg-percentage-label {
  font-size: 1.22em;
  font-weight: 700;
  fill: #6C3EFF;
  paint-order: stroke fill;
  /* For dark mode support, could adjust color dynamically if needed */
  /* Add a text-shadow for clarity on gray ring */
  text-shadow: 0 1px 1px #fff, 0 -1px 1px #fff, 0 0 4px #efeaff;
  user-select: none;
}

/* Dark mode: SVG percentage ring label much lighter purple */
.financeflow-main.dark .svg-percentage-label {
  fill: var(--color-progress-ring-primary, #b09bfe);
  text-shadow: 0 2px 7px #271a3c33, 0 1px 2px #bba8fd;
}

.svg-goal-label {
  font-size: 0.8em;
  font-weight: 500;
  fill: #988bdb;
  user-select: none;
  letter-spacing: 0.04em;
}

/* Dark mode: goal label lighter purple */
.financeflow-main.dark .svg-goal-label {
  fill: var(--color-goal-label, #bba8fd);
}

@media (max-width: 700px) {
  .svg-ring-outer {
    width: 62px; height: 62px;
  }
  .svg-ring {
    width: 62px; height: 62px;
  }
  /* Slightly reduce font size for mobile if needed */
  .svg-percentage-label { font-size: 1em; }
  .svg-goal-label { font-size: 0.7em; }
}
</style>
