/* ---------------------------
   DOM elements
   --------------------------- */
   const balance = document.getElementById('balance');
   const incomeAmount = document.getElementById('income-amount');
   const expenseAmount = document.getElementById('expense-amount');
   const transactionList = document.getElementById('transaction-list');
   const historyTitle = document.getElementById('history-title');
   const noTransPlaceholder = document.getElementById('no-trans-placeholder');
   
   const form = document.getElementById('transaction-form');
   const text = document.getElementById('text');
   const amount = document.getElementById('amount');
   const dateInput = document.getElementById('date');
   const categoryInput = document.getElementById('category');
   const typeInputs = document.getElementsByName('type');
   const errorMessage = document.getElementById('error-message');
   
   const filterCategory = document.getElementById('filter-category');
   const startDate = document.getElementById('start-date');
   const endDate = document.getElementById('end-date');
   const applyFilterBtn = document.getElementById('apply-filter');
   const clearFilterBtn = document.getElementById('clear-filter');
   
   const exportBtn = document.getElementById('export-btn');
   const resetBtn = document.getElementById('reset-btn');
   
   const monthlySummaryContainer = document.getElementById('monthly-summary');
   
   /* ---------------------------
      Data: load from localStorage
      --------------------------- */
   const STORAGE_KEY = 'transactions_v1';
   let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
   
   /* ---------------------------
      Utility helpers
      --------------------------- */
   function generateID() {
     return Date.now() + Math.floor(Math.random() * 1000);
   }
   
   function saveToStorage() {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
   }
   
   /* Format date to YYYY-MM-DD for inputs and ISO display */
   function formatDateISO(d) {
     const dt = new Date(d);
     const y = dt.getFullYear();
     const m = String(dt.getMonth() + 1).padStart(2, '0');
     const day = String(dt.getDate()).padStart(2, '0');
     return `${y}-${m}-${day}`;
   }
   
   /* Nice readable date */
   function formatDateReadable(d) {
     const dt = new Date(d);
     return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
   }
   
   /* Show inline error message (auto hides) */
   function showError(msg, time = 3000) {
     errorMessage.textContent = msg;
     errorMessage.style.display = 'block';
     setTimeout(() => { errorMessage.style.display = 'none'; }, time);
   }
   
   /* Toggle history visibility */
   function toggleHistoryVisibility() {
     if (transactions.length === 0) {
       historyTitle.style.display = 'none';
       noTransPlaceholder.style.display = 'block';
     } else {
       historyTitle.style.display = 'block';
       noTransPlaceholder.style.display = 'none';
     }
   }
   
   /* ---------------------------
      Render functions
      --------------------------- */
   
   /* Render single transaction into list */
   function addTransactionDOM(transaction) {
     const li = document.createElement('li');
   
     const left = document.createElement('div');
     left.className = 'item-left';
   
     const badge = document.createElement('div');
     badge.className = 'badge';
     badge.textContent = transaction.category || 'Other';
   
     const nameCol = document.createElement('div');
     const nameEl = document.createElement('div');
     nameEl.className = 'tx-name';
     nameEl.textContent = transaction.name;
   
     const metaEl = document.createElement('div');
     metaEl.className = 'tx-meta';
     metaEl.textContent = `${formatDateReadable(transaction.date)} • ${transaction.type}`;
   
     nameCol.appendChild(nameEl);
     nameCol.appendChild(metaEl);
   
     left.appendChild(badge);
     left.appendChild(nameCol);
   
     const amountEl = document.createElement('div');
     amountEl.className = 'tx-amount ' + (transaction.amount > 0 ? 'plus' : 'minus');
     amountEl.textContent = (transaction.amount > 0 ? '+$' : '-$') + Math.abs(transaction.amount).toFixed(2);
   
     const deleteBtn = document.createElement('button');
     deleteBtn.className = 'delete-btn';
     deleteBtn.title = 'Delete transaction';
     deleteBtn.innerHTML = '✕';
     deleteBtn.addEventListener('click', () => removeTransaction(transaction.id));
   
     li.appendChild(left);
     li.appendChild(amountEl);
     li.appendChild(deleteBtn);
   
     li.classList.add(transaction.amount > 0 ? 'income' : 'expense');
   
     transactionList.appendChild(li);
   }
   
   /* Render entire transactions list (optionally pass list to render filtered results) */
   function renderTransactions(list = transactions) {
     transactionList.innerHTML = '';
     if (list.length === 0) {
       toggleHistoryVisibility();
       return;
     }
     list.forEach(addTransactionDOM);
     toggleHistoryVisibility();
   }
   
   /* Update totals: balance, income, expense */
   function updateTotals(list = transactions) {
     const amounts = list.map(t => t.amount);
     const total = amounts.reduce((acc, x) => acc + x, 0);
     const income = amounts.filter(x => x > 0).reduce((a, b) => a + b, 0);
     const expense = Math.abs(amounts.filter(x => x < 0).reduce((a, b) => a + b, 0));
   
     balance.innerText = `$${total.toFixed(2)}`;
     incomeAmount.innerText = `+$${income.toFixed(2)}`;
     expenseAmount.innerText = `-$${expense.toFixed(2)}`;
   }
   
   /* ---------------------------
      CRUD operations
      --------------------------- */
   
   /* Add transaction (form submit) */
   function addTransaction(e) {
     e.preventDefault();
   
     const name = text.value.trim();
     const amtRaw = amount.value;
     const amt = Number(amtRaw);
     const category = categoryInput.value || 'Other';
     const type = [...typeInputs].find(i => i.checked).value;
     const dateVal = dateInput.value || formatDateISO(new Date());
   
     // Basic validation
     if (!name) { showError('Please enter a transaction name.'); return; }
     if (!amtRaw || isNaN(amt) || amt === 0) { showError('Please enter a non-zero numeric amount.'); return; }
   
     const finalAmount = type === 'expense' ? -Math.abs(amt) : Math.abs(amt);
   
     const transaction = {
       id: generateID(),
       name,
       amount: finalAmount,
       type,
       date: dateVal,
       category
     };
   
     transactions.push(transaction);
     saveToStorage();
     renderTransactions();
     updateTotals();
     updateMonthlySummary();
   
     // Reset form
     text.value = '';
     amount.value = '';
     dateInput.value = '';
     categoryInput.value = 'Salary';
     typeInputs[0].checked = true;
   }
   
   /* Remove transaction by id */
   function removeTransaction(id) {
     transactions = transactions.filter(t => t.id !== id);
     saveToStorage();
     renderTransactions();
     updateTotals();
     updateMonthlySummary();
   }
   
   /* Reset all (clear storage, reload state) */
   function resetAll() {
     if (!confirm('Are you sure you want to reset all transactions? This cannot be undone.')) return;
     transactions = [];
     saveToStorage();
     renderTransactions();
     updateTotals();
     updateMonthlySummary();
   }
   
   /* ---------------------------
      Filters
      --------------------------- */
   
   /* Apply category and date filters: returns filtered array */
   function getFilteredTransactions() {
     const cat = filterCategory.value;
     const s = startDate.value ? new Date(startDate.value) : null;
     const e = endDate.value ? new Date(endDate.value) : null;
   
     return transactions.filter(t => {
       const matchCat = (cat === 'all') ? true : (t.category === cat);
       const txDate = new Date(t.date);
       const matchDate = (() => {
         if (s && e) {
           // include inclusive range
           return txDate >= s && txDate <= e;
         } else if (s) {
           return txDate >= s;
         } else if (e) {
           return txDate <= e;
         }
         return true;
       })();
       return matchCat && matchDate;
     });
   }
   
   /* Apply filter button */
   function applyFilters() {
     const filtered = getFilteredTransactions();
     renderTransactions(filtered);
     updateTotals(filtered);
   }
   
   /* Clear filters */
   function clearFilters() {
     filterCategory.value = 'all';
     startDate.value = '';
     endDate.value = '';
     renderTransactions();
     updateTotals();
   }
   
   /* ---------------------------
      Monthly summary
      --------------------------- */
   
   /* Generate monthly summary object */
   function getMonthlySummary() {
     // group by "Month Year" e.g., "Oct 2025"
     const map = {};
     transactions.forEach(t => {
       const dt = new Date(t.date);
       const key = dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
       if (!map[key]) map[key] = { income: 0, expense: 0 };
       if (t.amount > 0) map[key].income += t.amount;
       else map[key].expense += Math.abs(t.amount);
     });
     return map;
   }
   
   /* Render monthly summary */
   function updateMonthlySummary() {
     const summary = getMonthlySummary();
     monthlySummaryContainer.innerHTML = '';
     const keys = Object.keys(summary).sort((a, b) => {
       // sort by date descending (most recent first)
       const ad = new Date(a.split(' ')[1], new Date(Date.parse(a.split(' ')[0] + " 1")).getMonth());
       const bd = new Date(b.split(' ')[1], new Date(Date.parse(b.split(' ')[0] + " 1")).getMonth());
       return bd - ad;
     });
   
     if (keys.length === 0) {
       monthlySummaryContainer.innerHTML = '<p class="muted">No monthly data yet.</p>';
       return;
     }
   
     keys.forEach(k => {
       const row = document.createElement('div');
       row.className = 'month-row';
       row.innerHTML = `
         <div class="label">${k}</div>
         <div class="values">Income: $${summary[k].income.toFixed(2)} &nbsp; • &nbsp; Expense: $${summary[k].expense.toFixed(2)}</div>
       `;
       monthlySummaryContainer.appendChild(row);
     });
   }
   
   /* ---------------------------
      Export CSV
      --------------------------- */
   function exportToCSV() {
     if (transactions.length === 0) { showError('No transactions to export.'); return; }
   
     const headers = ['Name', 'Amount', 'Type', 'Date', 'Category'];
     const rows = transactions.map(t => [
       `"${t.name.replace(/"/g, '""')}"`,
       t.amount,
       t.type,
       t.date,
       t.category
     ].join(','));
   
     const csvContent = [headers.join(','), ...rows].join('\n');
   
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const today = formatDateISO(new Date());
     const filename = `transactions_${today}.csv`;
     if (navigator.msSaveBlob) { // IE 10+
       navigator.msSaveBlob(blob, filename);
     } else {
       const link = document.createElement('a');
       const url = URL.createObjectURL(blob);
       link.setAttribute('href', url);
       link.setAttribute('download', filename);
       link.style.visibility = 'hidden';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
     }
   }
   
   /* ---------------------------
      Initialization
      --------------------------- */
   
   function initApp() {
     // Render existing transactions on start
     renderTransactions();
     updateTotals();
     updateMonthlySummary();
   
     // Pre-fill date input with today's date as placeholder (not mandatory)
     dateInput.placeholder = formatDateISO(new Date());
   
     // If storage empty, show placeholder
     toggleHistoryVisibility();
   }
   
   /* ---------------------------
      Event listeners
      --------------------------- */
   form.addEventListener('submit', addTransaction);
   applyFilterBtn.addEventListener('click', applyFilters);
   clearFilterBtn.addEventListener('click', clearFilters);
   exportBtn.addEventListener('click', exportToCSV);
   resetBtn.addEventListener('click', resetAll);
   
   /* Initialize app on load */
   initApp();
   
   /* make removeTransaction accessible to any inline usage (if any) */
   window.removeTransaction = removeTransaction;
   