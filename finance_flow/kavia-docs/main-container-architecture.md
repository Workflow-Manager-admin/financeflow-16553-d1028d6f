# FinanceFlow Main Container – Component Architecture & Data Flow Outline

## Overview

The `MainContainer.vue` component is the primary container and layout root of the FinanceFlow application. It orchestrates nearly all top-level behaviors and UI for expense/income tracking, visualization, onboarding, and theming. This document outlines its main architectural structure, key child components, UI layout patterns (including responsiveness, theming, and user notifications), and current-vs-future state/data management flows.

---

## 1. High-Level Component Hierarchy

```
App.vue
│
└─ MainContainer.vue  ← [primary page container]
    ├─ ConfettiModal        [celebration modal: goal achieved]
    ├─ TransactionForm      [transaction creation/edit]
    ├─ PieChart             [expense category visualization]
    ├─ LineChart            [monthly trends]
    └─ (inline) UI elements for onboarding, notifications, theming, grid layout, filtering, savings goal ring...
```

**Child Components:**
- **ConfettiModal.vue**: Displays celebratory overlay when the user's savings goal is met.
    - Takes a single prop (`visible`) and emits `close` event.
- **TransactionForm.vue**: Handles add/edit for transactions (with dynamic categories, locked/switchable type, validation), emitting `submit`/`cancel`.
    - Used twice for dual-panel (expense/income) form display.
- **PieChart.vue**: Reusable, reactive Chart.js doughnut for visualizing expenses by category.
    - Receives a summary of current expense data.
- **LineChart.vue**: Shows income/expense time-series using reactive props.
    - Receives computed transaction data and date labels.
- **(Inline/Local) UI Sections**: Onboarding banner (with dismiss logic), notification container, theme-toggle, savings goal/progress ring, transaction filters, responsive grid.

---

## 2. UI/UX Structure & Theming

- **CSS/Theming**
  - Colors managed using CSS variables: see [`src/assets/base.css`](../src/assets/base.css).
      - Supports light/dark via system, manual toggle (theme saved in `localStorage`).
      - Custom accent, border, and background variables for a Google-style clean UI.
  - Component/utility classes for cards, grid, and dark mode (e.g., `.financeflow-main.dark`) in [`src/assets/main.css`](../src/assets/main.css).
  - Responsive grid layout for sidebar + main; stack vertically for smaller screens.
  - Custom styling for savings goal fields, transitions for notifications/onboarding.

- **Inline Structures (MainContainer.vue)**
  - **Onboarding**: Banner/modal shown until dismissed (based on `localStorage` flag); “Welcome to FinanceFlow!” with action.
  - **Notifications**: Transient, stacked messages auto-dismissed after timeout—only one shown at a time for UX clarity.
  - **Theme Toggle**: Floating button; supports color scheme switch, reflects current mode.

---

## 3. Main Data Flow & State Management

### Current Flow:
- **State Management:**
    - All state (transactions, filters, notifications, theme status, savings goal, progress, etc.) is managed locally inside `MainContainer.vue` with Vue `ref`/`computed`.
- **Persistence:**
    - Transactions, savings goal, and user preferences are read from and written to `localStorage`.
    - Demo data is loaded if no persistent data exists.
    - The onboarding dismiss state, confetti modal triggers, and savings milestones rely on localStorage markers.
- **Communication:**
    - Child components are rendered as controlled/pure components, with data passed in as `props`.
    - Actions reported via custom events (e.g., `submit`/`cancel` on `TransactionForm`, `close` on `ConfettiModal`), handled in the parent.
    - No global store at present for transaction data.

### Planned/Future Improvements:
- **Pinia Store**: The codebase is ready (Pinia installed, in main.ts) for migration to a true global store for transactions, goals, and settings. This will enable easier cloud sync and multi-component state flow.
- **Firebase Integration**: The component structure will allow drop-in data stores using Pinia-Firebase integration for real-time sync and multi-device support.
- **EmailJS Weekly Summaries**: Future variants may push weekly summaries via a backend or external API.

---

## 4. Component & UI Element Details

### MainContainer.vue responsibilities

- Application UI shell
- Theme selection/dark mode
- Initial onboarding banner and dismiss logic
- Notification stack manager
- Transaction CRUD logic and filter controls
- Savings goal—with interactive ring
- Progress notifications (75%, 100%) and confetti state logic
- Responsive grid for sidebar (goal, stats) + main (transactions/analytics visualizations)

### Child Components

- **TransactionForm.vue**
    - Handles both add and edit operations.
    - Props: `editMode`, `lockedType`, `modelValue`.
    - Emits `submit`, `cancel`.
    - Category choices depend on transaction type via `getCategoriesForType`.
    - Used as two forms (expense/income) for intuitive split entry.
- **PieChart.vue & LineChart.vue**
    - Receive reactive props; no direct mutations or state, completely controlled visually.
    - Only dependencies: series/labels (LineChart), summary data/colors (PieChart).
- **ConfettiModal.vue**
    - Shown via prop, reports closing via event.

### Inline/Inline-Only Patterns

- **Onboarding**
    - Displayed via local reactive state, auto-dismissed + persists to localStorage.
- **Notifications**
    - Array of objects with timed auto-dismiss, styled via state + transition classes.
- **Theming**
    - State toggled locally, immediately reflected in DOM and localStorage (syncs with prefers-color-scheme).
- **Grid/Responsiveness**
    - CSS grid (`main-grid`), responsive breakpoints adapt for desktop vs. mobile layout.
    - Sidebar for goals, main content for transactions/analytics.
    - See grid/card classes in both scoped style (`MainContainer.vue`) and global (`main.css`, `base.css`).

---

## 5. Diagram: Component & Data Relationships

```mermaid
graph TD
    AppVue(App.vue) --> MainContainer(MainContainer.vue)
    MainContainer --> ConfettiModal
    MainContainer --> TransactionForm
    MainContainer --> PieChart
    MainContainer --> LineChart
    MainContainer -.-> Onboarding[Onboarding Banner/UI]
    MainContainer -.-> Notifications[In-app Notifications]
    MainContainer -.-> Theming[Theme Toggle + Responsive CSS]
    MainContainer -.-> Filters[Transaction Filters, local]
    MainContainer ==> LocalStorage[(LocalStorage)]
    MainContainer .. Future ..> PiniaStore[(Pinia)]
    MainContainer .. Future ..> Firebase[(Firebase)]
    MainContainer .. Future ..> EmailJS[(EmailJS)]
    TransactionForm <..> MainContainer
    ConfettiModal <..> MainContainer
    PieChart <---> MainContainer
    LineChart <---> MainContainer
```

---

## 6. Future Considerations

- **Migration to Pinia** for all core data flows; make MainContainer more declarative, less stateful.
- Enable truly real-time and cloud-synced usage with **Firebase Firestore**.
- Refactor subcomponents to rely on global store for less prop-drilling and finer UX events.
- Enhance modularity for theming and notification systems.

---

## 7. References

- [`MainContainer.vue`](../src/components/MainContainer.vue)
- [`TransactionForm.vue`](../src/components/TransactionForm.vue)
- [`PieChart.vue`](../src/components/PieChart.vue)
- [`LineChart.vue`](../src/components/LineChart.vue)
- [`ConfettiModal.vue`](../src/components/ConfettiModal.vue)
- [`transaction-model.ts`](../src/components/transaction-model.ts)
- [`base.css`](../src/assets/base.css)
- [`main.css`](../src/assets/main.css)
