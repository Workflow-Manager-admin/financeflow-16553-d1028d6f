<template>
  <div :class="['financeflow-main', { dark: isDarkMode }]">
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
            <svg width="74" height="74">
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
            </svg>
            <div class="ring-value mini-ring-value">
              <div class="goal-value mini-goal-value">{{ goalProgress }}%</div>
              <div class="goal-label mini-goal-label">Goal</div>
            </div>
          </div>
          <div class="goal-desc mini-goal-desc">
            <template v-if="savingsGoal > 0">
              Save <span style="color:var(--primary); font-size:1.01em">${{ savingsGoal.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
              <span v-if="goalAccumulated > 0" style="font-size:0.93em;color:#7c73b3; font-weight:400;">({{ accLeftText }})</span>
            </template>
            <template v-else>
              Set your savings goal!
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
              class="goal-input mini-input"
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
              class="goal-form compact"
              @submit.prevent="setSavingsGoal"
            >
              <input
                v-model.number="goalInput"
                type="number"
                min="1"
                step="0.01"
                placeholder="New goal ($)"
                class="goal-input mini-input"
                required
              />
              <button
                type="submit"
                class="goal-set-btn mini-goal-set-btn"
                :disabled="!goalInput || goalInput <= 0"
              >Save</button>
              <button type="button" class="goal-cancel-btn mini-goal-cancel-btn" @click="cancelGoalEdit">Cancel</button>
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

// Reset notification triggers if changing goal or going below milestones
watch([savingsGoal, goalProgress], ([goal, pct]) => {
  if (!goal) {
    notified100.value = false
    notified75.value = false
  } else {
    if (pct < 75) notified75.value = false
    if (pct < 100) notified100.value = false
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
.financeflow-main {
  --primary: #6C3EFF;
  --secondary: #F5F6FA;
  --accent: #6C3EFF;
  --income: #22bb66;
  --expense: #e94242;
  --main-bg: var(--secondary);
  --card-bg: #fff;
  --shadow: 0 2px 12px 0 rgba(60,48,106,0.07);
  min-height: 100svh;
  width: 100vw;
  min-width: 0;
  background: var(--main-bg);
  font-family: 'Inter', system-ui, sans-serif;
  transition: background 0.4s;
  box-sizing: border-box;
  /* Ensure main always covers viewport and no visual clipping */
  overflow-x: hidden;
}

.financeflow-main.dark {
  /* True dark background, use nearly black for highest contrast */
  --main-bg: #121216;
  --card-bg: #181824;
  --primary: #6C3EFF;
  --accent: #6C3EFF;
  --secondary: #23223c;
  --income: #22bb66;
  --expense: #e94242;
  color: #fafaff;
  background: var(--main-bg);
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(210px, 260px) 1fr;
  gap: 2.4rem;
  padding: 1.4rem 0;
  min-width: 0;
  min-height: 70vh;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  /* Prevent grid area from shrinking so left/right are always visible */
  background: transparent;
}

@media (max-width: 1100px) {
  .main-grid {
    grid-template-columns: 1fr 1.6fr;
    gap: 1.3rem;
  }
}
@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
    padding: 0.7rem 0;
    gap: 1.2rem;
    min-width: 0;
    width: 100%;
  }
  .side-panel {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-evenly;
    width: 100%;
    min-width: 0;
    max-width: 100vw;
  }
  .main-content {
    width: 100%;
  }
}
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  min-width: 0;
  width: 100%;
  max-width: 260px;
}

.savings-goal-card {
  background: var(--card-bg);
  border-radius: 18px;
  padding: 1.2rem 0.6rem 1rem 0.6rem;
  box-shadow: var(--shadow);
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 0;
}
/* --- SAVINGS RING: Mini + Alignment Tweak Styles --- */
.ring-placeholder {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 108px;
  height: 108px;
  margin-bottom: 0.5rem;
  margin-left: auto;
  margin-right: auto;
}
.ring-placeholder svg {
  display: block;
  margin: 0 auto;
  width: 90px;
  height: 90px;
}

.ring-placeholder.mini-ring {
  width: 74px;
  height: 74px;
  margin-bottom: 0.46rem;
}

.ring-placeholder.mini-ring svg {
  width: 74px;
  height: 74px;
}

.ring-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -57%);
  width: 90px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  justify-content: center;
}

.ring-value.mini-ring-value {
  width: 74px;
  height: 40px;
}
.goal-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--primary);
}
.goal-label {
  font-size: 0.9rem;
  font-weight: 400;
  color: #6a6a8e;
  opacity: 0.92;
}

.goal-value.mini-goal-value {
  font-size: 1.32rem;
  font-weight: 600;
}
.goal-label.mini-goal-label {
  font-size: 0.83rem;
  margin-top: -.17em;
}

.goal-desc {
  margin-top: 0.2rem;
  font-size: 1.08rem;
  text-align: center;
  color: var(--primary);
  font-weight: 500;
}
.mini-goal-desc {
  margin-top: 0.12em;
  font-size: 1.02rem;
  color: var(--primary);
  font-weight: 500;
  text-align: center;
}

/* --- Mini/Compact Goal Input Alignment+Size --- */
.goal-form {
  display: flex;
  align-items: center;
  gap: 0.45em;
}

.goal-form.compact {
  gap: 0.23em;
  justify-content: center;
  margin-top: 0.30em;
  margin-bottom: 0.10em;
}

/* Regular input style */
.goal-input {
  border-radius: 9px;
  border: 1.2px solid #eceafb;
  padding: 0.38em 0.82em;
  font-size: 1.04em;
  background: #f5f6fa;
  color: #36228f;
  outline: none;
  transition: border 0.2s;
}
/* Smaller version for sidebar compact */
.goal-input.mini-input {
  width: 60px;
  font-size: .97em;
  padding: 0.29em 0.62em;
  border-radius: 7px;
  margin-right: 0.12em;
}

.financeflow-main.dark .goal-input,
.financeflow-main.dark .goal-input.mini-input {
  background: #23223c;
  border: 1px solid #50498e;
  color: #fafaff;
}
.goal-input:focus {
  border: 1.5px solid var(--primary);
}

/* Button tweaks for mini version */
.goal-set-btn, .goal-cancel-btn {
  border-radius: 13px;
  padding: 0.26em 1.4em;
  font-size: 1em;
  font-weight: 600;
  border: none;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  margin-left: 0.2em;
  transition: background 0.18s;
}
.goal-set-btn.mini-goal-set-btn {
  padding: 0.23em 0.77em;
  font-size: .96em;
  border-radius: 9px;
  margin-left: 0.09em;
}

.goal-set-btn:disabled,
.goal-set-btn.mini-goal-set-btn:disabled {
  opacity: 0.6;
  pointer-events: none;
  background: #c6baf6;
}

.goal-cancel-btn {
  background: #fff;
  color: #6C3EFF;
  border: 1px solid #6C3EFF;
  margin-left: 0.34em;
}
.goal-cancel-btn.mini-goal-cancel-btn {
  color: #6C3EFF;
  background: #fff;
  border: 1px solid #6C3EFF;
  font-size: 0.95em;
  border-radius: 8px;
  padding: 0.23em .68em;
  margin-left: 0.15em;
}
.goal-cancel-btn:hover,
.goal-cancel-btn.mini-goal-cancel-btn:hover {
  background: #f9f6ff;
}
.goal-set-btn:hover,
.goal-set-btn.mini-goal-set-btn:hover {
  background: #5439ce;
}
.mini-edit-goal-btn {
  margin: 0.35rem .04em .01em .01em;
  font-size: 0.89em;
  background: none;
  color: #8672d8;
  border: none;
  cursor: pointer;
  padding: 0 0.12em;
}
.mini-edit-goal-btn:hover {
  color: #5439ce;
}
.side-spacer {
  flex: 1;
}

/* Main content/section should fill the right grid area with no shrinking or overflow/black gap */
.main-content {
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: transparent;
  overflow-x: visible;
  /* Ensure section takes available space and won't cause overflow */
}

/* Transaction/Visualization/Notification Styles retain as previous */

.transact-filter-row {
  width: 100%;
}
.transaction-manager {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.2rem 1rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.2rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.1rem;
  color: var(--primary);
}
.transaction-controls {
  display: flex;
  gap: 1.2rem;
  align-items: flex-end;
  margin-bottom: 1.3rem;
  flex-wrap: wrap;
}
.add-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 1.08rem;
  font-weight: 500;
  padding: 0.47em 2em;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(108, 62, 255, 0.12);
  transition: background 0.2s;
}
.add-btn:hover {
  background: var(--accent);
}
.filters {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  flex-wrap: wrap;
}
.filter-input {
  border: 1.4px solid #eceafb;
  border-radius: 7px;
  background: #fff;
  color: #372a5a;
  padding: 0.36em 0.9em;
  font-size: 1rem;
  transition: border 0.2s;
}
.financeflow-main.dark .filter-input {
  background: #221b3a;
  color: #fff;
  border-color: #3f3a63;
}
.filter-input:focus {
  outline: none;
  border-color: var(--primary);
}
.transaction-list {
  margin-top: 0.1rem;
  min-height: 45px;
  border-top: 1px solid #eee;
  padding-top: 0.7rem;
}
.transaction-row {
  display: grid;
  grid-template-columns: 1fr 2.7fr 1.1fr 1.1fr;
  gap: 1.3rem;
  align-items: center;
  border-radius: 10px;
  transition: background 0.25s;
  padding: 0.44em 1em 0.44em 0.5em;
  margin-bottom: 0.34em;
  min-height: 38px;
}
.transaction-row.placeholder {
  opacity: 0.74;
  font-style: italic;
  color: #6b6590;
}
.edit-btn {
  background: none;
  border: none;
  color: #8672d8;
  font-size: 1.08em;
  margin-left: 0.5em;
  cursor: pointer;
  transition: color 0.13s;
  padding: 0 6px;
  border-radius: 6px;
}
.edit-btn:hover {
  color: #6C3EFF;
  background: #eceffc;
}
.amount.income {
  color: var(--income);
  font-weight: 600;
}
.amount.expense {
  color: var(--expense);
  font-weight: 600;
}
.visualizations-row {
  display: flex;
  gap: 1.45rem;
  flex-wrap: wrap;
  margin-top: 1.4rem;
  width: 100%;
  min-width: 0;
  max-width: 100vw;
  box-sizing: border-box;
}
.visualization-card {
  flex: 1 1 330px;
  min-width: 260px;
  max-width: 100%;
  background: var(--card-bg);
  border-radius: 13px;
  box-shadow: var(--shadow);
  padding: 1.1rem 1rem 1.6rem 1rem;
}
.chart-placeholder {
  height: 92px;
  color: #afabcf;
  background: #f9f9ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.77rem;
  font-weight: 500;
  font-size: 1.06rem;
}

/* Onboarding Banner */
.onboarding-banner {
  position: fixed;
  top: 26px;
  left: 50%;
  transform: translate(-50%, 0);
  background: var(--primary);
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 16px 2px rgba(108, 62, 255, 0.1);
  font-size: 1.14rem;
  display: flex;
  align-items: center;
  z-index: 1400;
  gap: 1.1em;
  animation: bounceInDown 0.8s;
}
.onboarding-close {
  color: var(--primary);
  background: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.6em 1.3em;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.onboarding-close:hover {
  background: #F9F6FF;
}

@keyframes bounceInDown {
  0% { opacity: 0; transform: translate(-50%, -80px);}
  70% { opacity: 1; transform: translate(-50%, 16px);}
  100% { opacity: 1; transform: translate(-50%, 0);}
}

/* Notifications */
.notifications {
  position: fixed;
  top: 62px;
  right: 28px;
  width: 300px;
  z-index: 1800;
}
.notification {
  background: #fff;
  color: #36228f;
  border-radius: 11px;
  padding: 0.74em 1em;
  box-shadow: 0 1px 11px 3px rgba(51,42,48,0.07);
  margin-bottom: 0.9em;
  font-size: 1.01rem;
  font-weight: 500;
  opacity: 0.92;
}
.notification.success {
  border-left: 5px solid var(--primary);
}
.notification.error {
  border-left: 5px solid var(--expense);
}
.financeflow-main.dark .notification {
  background: #302c47;
  color: #eee;
}

/* Theme Toggle Button */
.theme-toggle {
  position: absolute;
  top: 22px;
  right: 22px;
  background: var(--card-bg);
  border: none;
  border-radius: 18px;
  width: 42px;
  height: 42px;
  box-shadow: 0 2px 11px 0 rgba(60,48,106,0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.17s;
  z-index: 1500;
}
.theme-toggle:hover {
  background: #efe6ff;
}

/* Utility */
.card {
  box-shadow: var(--shadow);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.35s cubic-bezier(.9,.4,.44,1.2);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.notif-fade-enter-active, .notif-fade-leave-active {
  transition: all 0.3s cubic-bezier(.6,.34,.68,1.53);
}
.notif-fade-enter-from, .notif-fade-leave-to {
  opacity: 0;
  transform: translateY(-26px) scale(0.98);
}
/* --- Transaction Add Cards: Card/Panel Modern Separation --- */
.transaction-form-card-panel {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: transparent;
  border-radius: 18px;
  box-shadow: none;
  margin-bottom: 1.2rem;
  padding: 0;
}

.add-transaction-section-cards {
  display: flex;
  gap: 2rem;
  width: 100%;
  justify-content: space-between;
}

.transaction-add-card {
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(60,48,106,0.08);
  padding: 1.1rem 1rem 1.4rem 1rem;
  min-width: 225px;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  border: 1.3px solid #eceafb;
  transition: box-shadow .21s, border .18s, background .3s;
}

.financeflow-main.dark .transaction-add-card {
  background: #201a37;
  border-color: #29205a;
}
.add-type-title {
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 0.7em;
  text-align: left;
  letter-spacing: 0.01em;
}

.expense-add-card .add-type-title {
  color: var(--expense);
}
.income-add-card .add-type-title {
  color: var(--income);
}

/* Card hover/focus effect */
.transaction-add-card:focus-within,
.transaction-add-card:hover {
  box-shadow: 0 4px 24px 0 rgba(108,62,255,0.10);
  border-color: var(--primary);
}

/* Stacking on mobile */
@media (max-width: 900px) {
  .add-transaction-section-cards {
    flex-direction: column;
    gap: 1.1rem;
    max-width: 100vw;
  }
  .transaction-add-card {
    width: 100%;
    min-width: 0;
    max-width: none;
  }
}
</style>
