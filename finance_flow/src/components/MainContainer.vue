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
      <div v-for="notif in notifications" :key="notif.id" :class="['notification', notif.type]">
        {{ notif.message }}
      </div>
    </transition-group>

    <!-- Theme Toggle -->
    <button class="theme-toggle" @click="toggleTheme" :aria-label="'Switch to ' + (isDarkMode ? 'light' : 'dark') + ' mode'">
      <svg v-if="!isDarkMode" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#6C3EFF"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 19.07l-1.41 1.41M17.66 19.07l-1.41-1.41M6.34 4.93L4.93 6.34" stroke="#6C3EFF" stroke-width="2" stroke-linecap="round"/></svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#6C3EFF"/></svg>
    </button>

    <!-- Main Responsive Layout Grid -->
    <div class="main-grid">
      <!-- Sidebar or Progress Ring (Left on desktop, top on mobile) -->
      <aside class="side-panel">
        <!-- Savings Goal Progress Ring Placeholder -->
        <div class="savings-goal-card card">
          <div class="ring-placeholder">
            <svg width="90" height="90">
              <circle cx="45" cy="45" r="38" stroke="#E0E0E0" stroke-width="9" fill="none"/>
              <circle cx="45" cy="45" r="38" stroke="#6C3EFF" stroke-width="9" fill="none" stroke-dasharray="238" stroke-dashoffset="86"/>
            </svg>
            <div class="ring-value">
              <div class="goal-value">75%</div>
              <div class="goal-label">Goal</div>
            </div>
          </div>
          <div class="goal-desc">Your Savings Goal</div>
        </div>
        <!-- Theme toggle moved here for mobile -->
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
              <!-- Future filters section -->
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
              <div v-if="transactionFormOpen" style="margin-bottom:1.2rem;">
                <TransactionForm
                  :editMode="!!editIndex"
                  :modelValue="editIndex !== null && editIndex >= 0 ? transactions[editIndex] : null"
                  @submit="onTransactionFormSubmit"
                  @cancel="closeTransactionForm"
                />
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
                  <!-- Placeholder future: delete button -->
                  <!-- <button class="delete-btn" title="Delete" @click="">🗑</button> -->
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
import { ref, onMounted, computed } from 'vue'
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

// PUBLIC_INTERFACE
const isDarkMode = ref(false)
const showOnboarding = ref(false)
const notifications = ref<Notification[]>([])

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

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
  // If opening from edit, 'close' means reset:
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
    // Edit mode
    transactions.value[editIndex.value] = { ...txn }
    notifications.value.push({ id: Date.now(), type: "success", message: "Transaction updated." })
  } else {
    // Add mode
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

// Remove notification after delay
watch(notifications, (notifList) => {
  if (!notifList.length) return
  setTimeout(() => {
    notifications.value.shift()
  }, 2100)
})

onMounted(() => {
  if (!localStorage.getItem('financeflow-onboarded')) {
    showOnboarding.value = true
  }
  loadTransactions()
})

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
  background: var(--main-bg);
  font-family: 'Inter', system-ui, sans-serif;
  transition: background 0.4s;
}

/* Dark mode */
.financeflow-main.dark {
  --main-bg: #222236;
  --card-bg: #272748;
  color: #fafaff;
  background: var(--main-bg);
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 2.1fr;
  gap: 2.4rem;
  padding: 1.4rem 0 1.4rem 0;
  transition: all 0.3s cubic-bezier(.6,.34,.68,1.53);
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
    padding: 0.7rem 0;
    gap: 1.2rem;
  }
  .side-panel {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-evenly;
  }
}

/* Sidebar/Panel */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  min-width: 220px;
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
}

.ring-placeholder {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 0.5rem;
}

.ring-value {
  position: absolute;
  top: 19px;
  left: 0;
  width: 90px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
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

.goal-desc {
  margin-top: 0.2rem;
  font-size: 1.08rem;
  text-align: center;
  color: var(--primary);
  font-weight: 500;
}

/* Top Add/Filter row */
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

/* Add button and filter controls */
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

/* Transactions List */
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

/* Visualizations Row */
.visualizations-row {
  display: flex;
  gap: 1.45rem;
  flex-wrap: wrap;
  margin-top: 1.4rem;
}
.visualization-card {
  flex: 1 1 330px;
  min-width: 260px;
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
.side-spacer {
  flex: 1;
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
</style>
