<template>
  <form @submit.prevent="submitForm" class="transaction-form">
    <!-- Type selector only appears if lockedType is NOT supplied -->
    <div class="form-row" v-if="!lockedType">
      <label>Type</label>
      <select v-model="form.type" required>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
    </div>
    <!-- If lockedType is supplied, type is locked and no selector rendered -->
    <div class="form-row">
      <label>Category</label>
      <select v-model="form.category" required>
        <option v-for="cat in categoriesToShow" :key="cat" :value="cat">{{ cat }}</option>
        <option v-if="!categoriesToShow.includes(form.category)" :value="form.category">{{ form.category }}</option>
      </select>
    </div>
    <div class="form-row">
      <label>Amount</label>
      <input v-model.number="form.amount" required type="number" step="0.01" min="0.01" placeholder="ex: 25.50" />
    </div>
    <div class="form-row">
      <label>Date</label>
      <input v-model="form.date" required type="date" />
    </div>
    <div class="form-row">
      <label>Description</label>
      <input v-model="form.description" maxlength="40" type="text" placeholder="Optional" />
    </div>
    <div class="form-actions">
      <button class="form-submit" type="submit">{{ editMode ? 'Save' : 'Add' }}</button>
      <button v-if="editMode" class="form-cancel" type="button" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Transaction, TransactionType } from './transaction-model'
import { getCategoriesForType } from './transaction-model'

interface Props {
  modelValue?: Partial<Transaction>
  editMode?: boolean
  /**
   * When set ('income' or 'expense'), hides type field and locks type for this form.
   */
  lockedType?: TransactionType
}
const props = defineProps<Props>()
const emit = defineEmits(['submit', 'cancel'])

// Returns categories for current form type: lockedType if present, else form.type
const categoriesToShow = computed(() => {
  const type: TransactionType = props.lockedType ?? form.value.type ?? 'expense'
  return getCategoriesForType(type)
})

const emptyForm: Transaction = {
  id: '',
  type: 'expense',
  category: 'Groceries',
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

const form = ref<Transaction>({
  ...emptyForm,
  ...props.modelValue
})

// Whenever modelValue or lockedType changes, update the form accordingly
watch(
  () => [props.modelValue, props.lockedType],
  ([val, type]) => {
    // If lockedType present, always set type to lockedType (can't be edited)
    if (val) {
      form.value = { ...emptyForm, ...val }
    } else {
      form.value = { ...emptyForm }
    }
    if (type) {
      form.value.type = type
    }
  },
  { immediate: true }
)

const editMode = computed(() => props.editMode === true)

// PUBLIC_INTERFACE
function submitForm() {
  // Ensure type is locked before emitting submit (if prop exists)
  emit('submit', {
    ...form.value,
    ...(props.lockedType ? { type: props.lockedType } : {})
  })
}
</script>

<style scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.form-row label {
  font-size: 0.98rem;
  color: #6c3eff;
  font-weight: 500;
}
.form-row input,
.form-row select {
  padding: 0.37em 0.75em;
  font-size: 1.01rem;
  border: 1.2px solid #e5e1fa;
  border-radius: 6px;
  background: #fafaff;
}
.form-actions {
  display: flex;
  gap: 1em;
  align-items: center;
}
.form-submit {
  background: #6c3eff;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.5em 2em;
  font-size: 1.08rem;
  font-weight: 600;
  cursor: pointer;
}
.form-cancel {
  background: none;
  border: 1.2px solid #6c3eff;
  color: #6c3eff;
  border-radius: 18px;
  padding: 0.5em 1.7em;
  font-weight: 500;
  font-size: 1.02rem;
  cursor: pointer;
}
.form-submit:hover {
  background: #5b31db;
}
.form-cancel:hover {
  background: #f7f4ff;
}
</style>
