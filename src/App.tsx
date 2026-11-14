import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, CreditCard, Download, Ellipsis, FileUp, Filter,
  LayoutDashboard, Plus, Search, Settings2, SlidersHorizontal, Sparkles,
  Wallet, X, Utensils, House, CarFront, ShoppingBag, HeartPulse, Clapperboard,
  BriefcaseBusiness, Zap, CircleDollarSign, MoreHorizontal, Upload, Trash2, Pencil,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { categories, initialAccounts, initialBudgets, initialTransactions, type Account, type Budget, type Transaction } from './data';

type Section = 'Overview' | 'Transactions' | 'Budgets' | 'Accounts';
const money = (minor: number, compact = false) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  notation: compact ? 'compact' : 'standard',
}).format(minor / 100);
const monthKey = (date: string) => date.slice(0, 7);
const currentMonth = new Date().toISOString().slice(0, 7);
const monthLabel = (month: string) => new Date(`${month}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const palette = ['#d77756', '#e9b766', '#72a58d', '#7296b4', '#b989a2', '#b8a46b', '#8e9a80'];
const categoryIcons: Record<string, ReactNode> = {
  'Food & dining': <Utensils size={16} />, Home: <House size={16} />, Transport: <CarFront size={16} />,
  Bills: <Zap size={16} />, Shopping: <ShoppingBag size={16} />, Health: <HeartPulse size={16} />,
  Entertainment: <Clapperboard size={16} />, Salary: <BriefcaseBusiness size={16} />, Freelance: <CircleDollarSign size={16} />,
};

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initial;
    } catch { return initial; }
  });
  const update = (next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };
  return [value, update] as const;
}

function App() {
  const [section, setSection] = useState<Section>('Overview');
  const [transactions, setTransactions] = useStored<Transaction[]>('pennywise.transactions.v1', initialTransactions);
  const [accounts, setAccounts] = useStored<Account[]>('pennywise.accounts.v1', initialAccounts);
  const [budgets, setBudgets] = useStored<Budget[]>('pennywise.budgets.v1', initialBudgets);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [showTransaction, setShowTransaction] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState('');
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [quickKey, setQuickKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const monthTransactions = transactions.filter((item) => monthKey(item.date) === selectedMonth);
  const monthIncome = monthTransactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amountMinor, 0);
  const monthExpenses = monthTransactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amountMinor, 0);
  const totalBudget = budgets.find((item) => item.category === null)?.limitMinor ?? 0;
  const netWorth = accounts.reduce((sum, account) => sum + account.openingMinor + transactions.filter((item) => item.accountId === account.id).reduce((acc, item) => acc + (item.kind === 'income' ? item.amountMinor : -item.amountMinor), 0), 0);
  const latestTransactions = [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const filteredTransactions = [...transactions]
    .filter((item) => monthKey(item.date) === selectedMonth)
    .filter((item) => categoryFilter === 'All categories' || item.category === categoryFilter)
    .filter((item) => `${item.title} ${item.category} ${accounts.find((account) => account.id === item.accountId)?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const categoryData = categories
    .map((category, index) => ({ name: category, value: monthTransactions.filter((item) => item.kind === 'expense' && item.category === category).reduce((sum, item) => sum + item.amountMinor, 0), color: palette[index % palette.length] }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const trendData = Array.from({ length: 6 }, (_, index) => {
    const offset = index - 5;
    const date = new Date(`${selectedMonth}-02`);
    date.setMonth(date.getMonth() + offset);
    const key = date.toISOString().slice(0, 7);
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      income: transactions.filter((item) => monthKey(item.date) === key && item.kind === 'income').reduce((sum, item) => sum + item.amountMinor, 0) / 100,
      expenses: transactions.filter((item) => monthKey(item.date) === key && item.kind === 'expense').reduce((sum, item) => sum + item.amountMinor, 0) / 100,
    };
  });

  const notify = (message: string, undo?: () => void) => {
    setToast(message);
    setUndoAction(() => undo ?? null);
    window.setTimeout(() => { setToast(''); setUndoAction(null); }, 2800);
  };
  const openNewTransaction = () => { setEditing(null); setShowTransaction(true); };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setQuickKey(true); }
      if (event.key === 'Escape') { setQuickKey(false); setShowTransaction(false); setShowBudgetForm(false); setShowAccountForm(false); setShowImport(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const saveTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Math.round(Number(form.get('amount')) * 100);
    const draft: Transaction = {
      id: editing?.id ?? crypto.randomUUID(), title: String(form.get('title')).trim(),
      category: String(form.get('category')), amountMinor: amount, kind: String(form.get('kind')) as Transaction['kind'],
      date: String(form.get('date')), accountId: String(form.get('accountId')),
    };
    if (!draft.title || amount <= 0) return;
    setTransactions((current) => editing ? current.map((item) => item.id === editing.id ? draft : item) : [draft, ...current]);
    setShowTransaction(false);
    notify(editing ? 'Transaction updated' : 'Transaction added');
  };

  const removeTransaction = (id: string) => {
    const removed = transactions.find((item) => item.id === id);
    setTransactions((current) => current.filter((item) => item.id !== id));
    notify('Transaction deleted', removed ? () => setTransactions((current) => current.some((item) => item.id === removed.id) ? current : [removed, ...current]) : undefined);
  };

  const exportCsv = () => {
    const lines = [['Date', 'Description', 'Type', 'Category', 'Account', 'Amount'], ...transactions.map((item) => [item.date, item.title, item.kind, item.category, accounts.find((account) => account.id === item.accountId)?.name ?? '', (item.amountMinor / 100).toFixed(2)])];
    const content = lines.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    link.download = 'pennywise-transactions.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    notify('CSV export ready');
  };

  const navItems: { name: Section; icon: ReactNode }[] = [
    { name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { name: 'Transactions', icon: <ArrowDownLeft size={18} /> },
    { name: 'Budgets', icon: <SlidersHorizontal size={18} /> },
    { name: 'Accounts', icon: <Wallet size={18} /> },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={() => setSection('Overview')}><span className="brand-mark"><span /></span><span>pennywise</span></a>
        <div className="workspace-switch"><div className="avatar">A</div><div><strong>Alex Morgan</strong><small>Personal space</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">YOUR MONEY</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.name} className={`nav-item ${section === item.name ? 'active' : ''}`} onClick={() => { setSection(item.name); setMobileNav(false); }} aria-current={section === item.name ? 'page' : undefined}>{item.icon}<span>{item.name}</span>{item.name === 'Budgets' && <span className="nav-count">{budgets.length - 1}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><span className="privacy-dot" /><div><strong>Your money stays yours</strong><p>Saved in this browser only.</p></div></div>
          <button className="nav-item subtle" onClick={() => notify('Settings are coming soon')}><Settings2 size={18} /><span>Settings</span></button>
          <button className="nav-item subtle" onClick={() => notify('Help center coming soon')}><CircleHelp size={18} /><span>Help & support</span></button>
          <div className="sidebar-footer"><div className="avatar avatar-small">A</div><div><strong>Alex Morgan</strong><small>Personal account</small></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Ellipsis size={21} /></button>
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{section}</strong></div>
          <div className="top-actions"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up')}><Bell size={18} /><i /></button><div className="top-divider" /><button className="top-avatar" aria-label="Account menu">AM</button></div>
        </header>
        <div className="content-wrap">
          {section === 'Overview' && <>
            <div className="page-heading"><div><div className="eyebrow">SATURDAY, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div><h1>Your money, in focus.</h1><p>A clear picture of where you stand this month.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={exportCsv}><Download size={16} />Export</button><button className="button button-primary" onClick={openNewTransaction}><Plus size={17} />Add transaction</button></div></div>
            <div className="period-row"><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() - 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Previous month"><ChevronLeft size={16} /></button><span>{monthLabel(selectedMonth)}</span><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() + 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Next month"><ChevronRight size={16} /></button><button className="text-button" onClick={() => setSelectedMonth(currentMonth)}>This month</button></div>
            <section className="overview-grid" aria-label="Monthly summary">
              <article className="stat-panel net-panel"><div className="stat-top"><span>Available balance</span><span className="stat-icon coral"><Wallet size={18} /></span></div><strong className="stat-value">{money(netWorth)}</strong><div className="stat-foot"><span className="positive-chip"><ArrowUpRight size={14} /> 8.4%</span><span>across your accounts</span></div><div className="balance-line"><span>Income <b>{money(monthIncome, true)}</b></span><i /><span>Spent <b>{money(monthExpenses, true)}</b></span></div></article>
              <article className="stat-panel"><div className="stat-top"><span>Income</span><span className="stat-icon green"><ArrowDownLeft size={18} /></span></div><strong className="stat-value">{money(monthIncome)}</strong><div className="stat-foot"><span className="quiet-chip">{monthTransactions.filter((item) => item.kind === 'income').length} entries</span><span>this month</span></div><div className="mini-bars income-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
              <article className="stat-panel"><div className="stat-top"><span>Expenses</span><span className="stat-icon yellow"><ArrowUpRight size={18} /></span></div><strong className="stat-value">{money(monthExpenses)}</strong><div className="stat-foot"><span className="quiet-chip">{monthTransactions.filter((item) => item.kind === 'expense').length} entries</span><span>this month</span></div><div className="mini-bars expense-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
              <article className="stat-panel budget-stat"><div className="stat-top"><span>Monthly budget</span><span className="stat-icon blue"><SlidersHorizontal size={18} /></span></div><strong className="stat-value">{money(totalBudget)}</strong><div className="stat-foot"><span className={monthExpenses > totalBudget ? 'negative-chip' : 'positive-chip'}>{totalBudget ? Math.round((monthExpenses / totalBudget) * 100) : 0}% used</span><span>{money(Math.max(0, totalBudget - monthExpenses), true)} left</span></div><div className="progress-track"><i className={monthExpenses / (totalBudget || 1) >= 1 ? 'over' : monthExpenses / (totalBudget || 1) >= 0.8 ? 'warning' : ''} style={{ width: `${Math.min(100, totalBudget ? monthExpenses / totalBudget * 100 : 0)}%` }} /></div></article>
            </section>
            {monthExpenses >= totalBudget * 0.8 && totalBudget > 0 && <div className="budget-alert"><div className="alert-mark"><Sparkles size={17} /></div><div><strong>{monthExpenses > totalBudget ? 'You’re over your monthly budget.' : 'You’re getting close to your monthly budget.'}</strong><p>You’ve spent {money(monthExpenses)} of your {money(totalBudget)} overall limit.</p></div><button className="alert-action" onClick={() => setSection('Budgets')}>Review budgets <ChevronRight size={15} /></button><button className="icon-button alert-close" aria-label="Dismiss alert" onClick={(event) => event.currentTarget.parentElement?.remove()}><X size={16} /></button></div>}
            <div className="dashboard-grid">
              <section className="content-panel trend-panel"><div className="panel-heading"><div><h2>Cash flow</h2><p>Income and expenses over time</p></div><button className="select-button" onClick={() => notify('Showing the last 6 months')}><CalendarDays size={15} />6 months<ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-income" />Income</span><span><i className="legend-expense" />Expenses</span></div><div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData} barGap={5} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e9ece5" strokeDasharray="3 5" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#88908b', fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#88908b', fontSize: 11 }} tickFormatter={(value) => value === 0 ? '0' : `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => money(Number(value) * 100)} contentStyle={{ border: '1px solid #e6e9e1', borderRadius: 8, fontSize: 12 }} /><Bar dataKey="income" name="Income" fill="#78a58e" radius={[4, 4, 0, 0]} maxBarSize={22} /><Bar dataKey="expenses" name="Expenses" fill="#e6b45e" radius={[4, 4, 0, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div></section>
              <section className="content-panel category-panel"><div className="panel-heading"><div><h2>Spending by category</h2><p>Where your money went</p></div><button className="icon-button" aria-label="Category options" onClick={() => setSection('Transactions')}><Ellipsis size={19} /></button></div><div className="category-chart-wrap"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none">{categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: '1px solid #e6e9e1', borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(monthExpenses, true)}</strong><span>total spent</span></div></div><div className="category-legend">{categoryData.slice(0, 4).map((item) => <div className="category-line" key={item.name}><i style={{ backgroundColor: item.color }} /><span>{item.name}</span><b>{money(item.value, true)}</b></div>)}</div></div><button className="panel-link" onClick={() => setSection('Transactions')}>View all spending <ChevronRight size={15} /></button></section>
            </div>
            <section className="content-panel recent-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest money moves</p></div><button className="panel-link" onClick={() => setSection('Transactions')}>See all <ChevronRight size={15} /></button></div><TransactionTable items={latestTransactions} accounts={accounts} onEdit={(item) => { setEditing(item); setShowTransaction(true); }} onDelete={removeTransaction} /></section>
          </>}

          {section === 'Transactions' && <>
            <div className="page-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Transactions</h1><p>Every little move adds up.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={() => setShowImport(true)}><Upload size={16} />Import CSV</button><button className="button button-secondary" onClick={exportCsv}><Download size={16} />Export</button><button className="button button-primary" onClick={openNewTransaction}><Plus size={17} />Add transaction</button></div></div>
            <div className="period-row"><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() - 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Previous month"><ChevronLeft size={16} /></button><span>{monthLabel(selectedMonth)}</span><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() + 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Next month"><ChevronRight size={16} /></button><button className="text-button" onClick={() => setSelectedMonth(currentMonth)}>This month</button></div>
            <section className="content-panel transaction-page-panel"><div className="list-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" /><kbd>⌘ K</kbd></div><label className="filter-select"><Filter size={15} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={14} /></label><span className="results-count">{filteredTransactions.length} transactions</span></div><TransactionTable items={filteredTransactions} accounts={accounts} onEdit={(item) => { setEditing(item); setShowTransaction(true); }} onDelete={removeTransaction} /></section>
          </>}

          {section === 'Budgets' && <>
            <div className="page-heading"><div><div className="eyebrow">A LITTLE PLAN GOES A LONG WAY</div><h1>Budgets</h1><p>Stay intentional without watching every rupee.</p></div><div className="heading-actions"><button className="button button-primary" onClick={() => setShowBudgetForm(true)}><Plus size={17} />Create budget</button></div></div>
            <div className="period-row"><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() - 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Previous month"><ChevronLeft size={16} /></button><span>{monthLabel(selectedMonth)}</span><button className="period-button" onClick={() => { const date = new Date(`${selectedMonth}-02`); date.setMonth(date.getMonth() + 1); setSelectedMonth(date.toISOString().slice(0, 7)); }} aria-label="Next month"><ChevronRight size={16} /></button><button className="text-button" onClick={() => setSelectedMonth(currentMonth)}>This month</button></div>
            <section className="budget-overview"><div><span>Spent so far</span><strong>{money(monthExpenses)}</strong><small>across {budgets.filter((item) => item.category).length} category budgets</small></div><div className="budget-overview-center"><span>Overall limit</span><strong>{money(totalBudget)}</strong><div className="progress-track"><i className={monthExpenses / (totalBudget || 1) >= 1 ? 'over' : monthExpenses / (totalBudget || 1) >= 0.8 ? 'warning' : ''} style={{ width: `${Math.min(100, totalBudget ? monthExpenses / totalBudget * 100 : 0)}%` }} /></div></div><div className="budget-overview-right"><span>Still available</span><strong>{money(Math.max(0, totalBudget - monthExpenses))}</strong><small>{totalBudget ? Math.max(0, 100 - Math.round(monthExpenses / totalBudget * 100)) : 0}% of your plan</small></div></section>
            <div className="budget-list-heading"><div><h2>Monthly budgets</h2><p>Progress resets at the start of each month.</p></div><button className="text-button" onClick={() => setShowBudgetForm(true)}><Plus size={15} /> Add category</button></div>
            <section className="budget-grid">{budgets.map((budget, index) => {
              const spent = monthTransactions.filter((item) => item.kind === 'expense' && (budget.category ? item.category === budget.category : true)).reduce((sum, item) => sum + item.amountMinor, 0);
              const pct = budget.limitMinor ? spent / budget.limitMinor * 100 : 0;
              const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'good';
              return <article className="budget-card" key={budget.id}><div className="budget-card-top"><span className={`budget-category-icon cat-${index % 5}`}>{budget.category ? categoryIcons[budget.category] ?? <CircleDollarSign size={17} /> : <Wallet size={17} />}</span><div className="budget-card-title"><strong>{budget.category ?? 'Overall budget'}</strong><small>{budget.category ? 'Category limit' : 'All spending'}</small></div><button className="icon-button" aria-label={`Edit ${budget.category ?? 'overall'} budget`} onClick={() => { const next = window.prompt('Set monthly limit in INR', String(budget.limitMinor / 100)); if (next && Number(next) > 0) { setBudgets((items) => items.map((item) => item.id === budget.id ? { ...item, limitMinor: Math.round(Number(next) * 100) } : item)); notify('Budget updated'); } }}><Ellipsis size={18} /></button></div><div className="budget-card-values"><strong>{money(spent)}</strong><span>of {money(budget.limitMinor)}</span><b className={`budget-percent ${status}`}>{Math.round(pct)}%</b></div><div className="progress-track"><i className={status} style={{ width: `${Math.min(100, pct)}%` }} /></div><div className="budget-card-foot"><span className={`status-dot ${status}`} />{pct >= 100 ? `${money(spent - budget.limitMinor)} over limit` : pct >= 80 ? `${money(budget.limitMinor - spent)} left · getting close` : `${money(budget.limitMinor - spent)} left`}</div></article>;
            })}</section>
          </>}

          {section === 'Accounts' && <>
            <div className="page-heading"><div><div className="eyebrow">ALL IN ONE PLACE</div><h1>Your accounts</h1><p>Balances across the places you keep money.</p></div><div className="heading-actions"><button className="button button-primary" onClick={() => setShowAccountForm(true)}><Plus size={17} />Add account</button></div></div>
            <section className="account-total"><div><span>Total net position</span><strong>{money(netWorth)}</strong><small>Across {accounts.length} accounts</small></div><div className="account-total-decoration"><span /><span /><span /></div></section>
            <div className="accounts-heading"><h2>Connected accounts</h2><span>{accounts.length} accounts</span></div>
            <section className="account-grid">{accounts.map((account) => {
              const balance = account.openingMinor + transactions.filter((item) => item.accountId === account.id).reduce((sum, item) => sum + (item.kind === 'income' ? item.amountMinor : -item.amountMinor), 0);
              return <article className="account-card" key={account.id}><div className="account-card-top"><span className={`account-icon ${account.color}`}>{account.type === 'Credit card' ? <CreditCard size={19} /> : <Wallet size={19} />}</span><button className="icon-button" aria-label={`Account options for ${account.name}`} onClick={() => { const confirmed = window.confirm(`Remove ${account.name}? Transactions will remain in your records.`); if (confirmed) setAccounts((items) => items.filter((item) => item.id !== account.id)); }}><Ellipsis size={18} /></button></div><div className="account-type">{account.type}</div><h3>{account.name}</h3><div className="account-balance-label">Current balance</div><strong className="account-balance">{money(balance)}</strong><button className="account-transactions" onClick={() => { setSection('Transactions'); setSearch(account.name); }}>View transactions <ChevronRight size={15} /></button></article>;
            })}<button className="add-account-tile" onClick={() => setShowAccountForm(true)}><span><Plus size={20} /></span><strong>Add another account</strong><small>Cash, bank, credit card, wallet</small></button></section>
            <div className="accounts-note"><CircleHelp size={16} /><span>These are manual accounts. Balances update as you add transactions.</span></div>
          </>}
        </div>
      </main>

      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      {showTransaction && <Modal title={editing ? 'Edit transaction' : 'Add transaction'} subtitle="A quick note is all it takes." onClose={() => setShowTransaction(false)}><form className="form-stack" onSubmit={saveTransaction}><div className="segmented"><label><input type="radio" name="kind" value="expense" defaultChecked={editing?.kind !== 'income'} /><span><ArrowUpRight size={15} />Expense</span></label><label><input type="radio" name="kind" value="income" defaultChecked={editing?.kind === 'income'} /><span><ArrowDownLeft size={15} />Income</span></label></div><label className="form-field amount-field"><span>Amount</span><div><span>₹</span><input name="amount" type="number" min="1" step="0.01" placeholder="0.00" defaultValue={editing ? editing.amountMinor / 100 : ''} required autoFocus /></div></label><label className="form-field"><span>Description</span><input name="title" placeholder="e.g. Lunch with friends" defaultValue={editing?.title} required /></label><div className="form-row"><label className="form-field"><span>Category</span><select name="category" defaultValue={editing?.category ?? 'Food & dining'}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="form-field"><span>Date</span><input name="date" type="date" defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)} required /></label></div><label className="form-field"><span>Account</span><select name="accountId" defaultValue={editing?.accountId ?? accounts[0]?.id}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowTransaction(false)}>Cancel</button><button className="button button-primary" type="submit"><Check size={16} />{editing ? 'Save changes' : 'Save transaction'}</button></div></form></Modal>}
      {showBudgetForm && <Modal title="Create a budget" subtitle="Give your money a little direction." onClose={() => setShowBudgetForm(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const category = String(form.get('category')); const limitMinor = Math.round(Number(form.get('limit')) * 100); if (!limitMinor) return; setBudgets((items) => { const exists = items.find((item) => item.category === (category === 'Overall budget' ? null : category)); return exists ? items.map((item) => item.id === exists.id ? { ...item, limitMinor } : item) : [...items, { id: crypto.randomUUID(), category: category === 'Overall budget' ? null : category, limitMinor }]; }); setShowBudgetForm(false); notify('Budget saved'); }}><label className="form-field"><span>Budget for</span><select name="category"><option>Overall budget</option>{categories.filter((item) => !['Salary', 'Freelance', 'Other income'].includes(item)).map((category) => <option key={category}>{category}</option>)}</select></label><label className="form-field amount-field"><span>Monthly limit</span><div><span>₹</span><input name="limit" type="number" min="1" step="1" placeholder="0" required /></div></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowBudgetForm(false)}>Cancel</button><button className="button button-primary"><Check size={16} />Save budget</button></div></form></Modal>}
      {showAccountForm && <Modal title="Add an account" subtitle="Keep all your balances in one view." onClose={() => setShowAccountForm(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const account: Account = { id: crypto.randomUUID(), name: String(form.get('name')).trim(), type: String(form.get('type')) as Account['type'], openingMinor: Math.round(Number(form.get('balance')) * 100), color: ['green', 'blue', 'yellow'][accounts.length % 3] }; setAccounts((items) => [...items, account]); setShowAccountForm(false); notify('Account added'); }}><label className="form-field"><span>Account name</span><input name="name" placeholder="e.g. ICICI savings" required /></label><label className="form-field"><span>Account type</span><select name="type"><option>Bank</option><option>Cash</option><option>Wallet</option><option>Credit card</option></select></label><label className="form-field amount-field"><span>Opening balance</span><div><span>₹</span><input name="balance" type="number" step="0.01" defaultValue="0" required /></div></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowAccountForm(false)}>Cancel</button><button className="button button-primary"><Check size={16} />Add account</button></div></form></Modal>}
      {showImport && <ImportModal fileRef={fileRef} onClose={() => setShowImport(false)} onImport={(items) => { setTransactions((current) => [...items, ...current]); setShowImport(false); notify(`${items.length} transactions imported`); }} accounts={accounts} />}
      {quickKey && <Modal title="Quick add" subtitle="Choose what you’d like to do." onClose={() => setQuickKey(false)}><div className="quick-actions"><button onClick={() => { setQuickKey(false); openNewTransaction(); }}><Plus size={18} /><span><strong>Add transaction</strong><small>Record income or an expense</small></span><kbd>↵</kbd></button><button onClick={() => { setQuickKey(false); setSection('Transactions'); }}><Search size={18} /><span><strong>Search transactions</strong><small>Find a recent money move</small></span><kbd>/</kbd></button></div></Modal>}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}{undoAction && <button className="toast-undo" onClick={() => { undoAction(); setToast(''); setUndoAction(null); }}>Undo</button>}</div>}
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden />
    </div>
  );
}

function TransactionTable({ items, accounts, onEdit, onDelete }: { items: Transaction[]; accounts: Account[]; onEdit: (item: Transaction) => void; onDelete: (id: string) => void }) {
  if (!items.length) return <div className="empty-state"><span><Search size={19} /></span><strong>No transactions here yet</strong><p>Try a different search or add your first transaction.</p></div>;
  return <div className="table-scroll"><table className="transactions-table"><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>ACCOUNT</th><th className="amount-col">AMOUNT</th><th aria-label="Actions"></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="transaction-name"><span className={`transaction-icon ${item.kind}`}>{categoryIcons[item.category] ?? (item.kind === 'income' ? <ArrowDownLeft size={16} /> : <CircleDollarSign size={16} />)}</span><div><strong>{item.title}</strong><small>{item.kind === 'income' ? 'Income' : 'Expense'}</small></div></div></td><td><span className="category-pill"><i style={{ backgroundColor: palette[Math.max(0, categories.indexOf(item.category)) % palette.length] }} />{item.category}</span></td><td className="date-cell">{dateLabel(item.date)}</td><td className="account-cell">{accounts.find((account) => account.id === item.accountId)?.name ?? 'Account removed'}</td><td className={`amount-cell ${item.kind}`}>{item.kind === 'income' ? '+' : '−'}{money(item.amountMinor)}</td><td><div className="row-actions"><button className="row-action" aria-label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={15} /></button><button className="row-action delete-action" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item.id)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>{children}</section></div>;
}

function ImportModal({ fileRef, onClose, onImport, accounts }: { fileRef: React.RefObject<HTMLInputElement | null>; onClose: () => void; onImport: (items: Transaction[]) => void; accounts: Account[] }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ date: '', title: '', amount: '', category: '' });
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const parseCsv = (text: string) => text.trim().split(/\r?\n/).map((line) => {
    const values: string[] = []; let value = ''; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { values.push(value.trim()); value = ''; }
      else value += character;
    }
    values.push(value.trim()); return values;
  });
  const loadFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) { setError('This file needs a header row and at least one transaction.'); return; }
    const names = parsed[0]; setHeaders(names); setRows(parsed.slice(1).filter((row) => row.some(Boolean)));
    const find = (terms: string[]) => names.find((name) => terms.some((term) => name.toLowerCase().includes(term))) ?? '';
    setMapping({ date: find(['date']), title: find(['description', 'title', 'note', 'merchant']), amount: find(['amount', 'value']), category: find(['category', 'type']) });
    setError(''); setStep(2);
  };
  const importRows = () => {
    const indexOf = (name: string) => headers.indexOf(name);
    const imported = rows.flatMap((row, index) => {
      const rawAmount = Number((row[indexOf(mapping.amount)] ?? '').replace(/[₹,\s]/g, ''));
      const dateValue = row[indexOf(mapping.date)] ?? '';
      const parsedDate = new Date(dateValue);
      if (!Number.isFinite(rawAmount) || !dateValue || Number.isNaN(parsedDate.getTime())) return [];
      const categoryValue = row[indexOf(mapping.category)] || 'Other expense';
      const isIncome = /income|salary|deposit|credit/i.test(categoryValue) || rawAmount < 0;
      return [{ id: `import-${crypto.randomUUID()}-${index}`, title: row[indexOf(mapping.title)] || 'Imported transaction', category: categories.includes(categoryValue) ? categoryValue : isIncome ? 'Other income' : 'Other expense', amountMinor: Math.round(Math.abs(rawAmount) * 100), kind: isIncome ? 'income' as const : 'expense' as const, date: parsedDate.toISOString().slice(0, 10), accountId: accounts[0]?.id ?? '' }];
    });
    if (!imported.length) { setError('No valid rows found. Check your date and amount column mappings.'); return; }
    onImport(imported);
  };
  return <Modal title="Import transactions" subtitle="Bring your spending history with you." onClose={onClose}><div className="import-steps"><span className={step >= 1 ? 'current' : ''}>1 <b>Upload</b></span><i /><span className={step >= 2 ? 'current' : ''}>2 <b>Map columns</b></span><i /><span className={step >= 3 ? 'current' : ''}>3 <b>Review</b></span></div>{step === 1 && <div className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void loadFile(event.dataTransfer.files[0]); }}><span><FileUp size={22} /></span><strong>Choose a CSV file or drop it here</strong><small>Exported from your bank or spreadsheet</small><button type="button" className="button button-secondary">Browse files</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => void loadFile(event.target.files?.[0])} /></div>}{step >= 2 && <><div className="import-file"><FileUp size={17} /><span>{fileName}</span><small>{rows.length} rows</small><button className="text-button" onClick={() => setStep(1)}>Change</button></div><div className="mapping-grid">{(['date', 'title', 'amount', 'category'] as const).map((field) => <label className="form-field" key={field}><span>{({ date: 'Date', title: 'Description', amount: 'Amount', category: 'Category or type' })[field]}</span><select value={mapping[field]} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">Choose column</option>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>)}</div><div className="preview-head"><strong>Preview</strong><span>Showing {Math.min(rows.length, 5)} of {rows.length}</span></div><div className="preview-table"><table><thead><tr>{headers.slice(0, 4).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index}>{headers.slice(0, 4).map((_, cell) => <td key={cell}>{row[cell] || '—'}</td>)}</tr>)}</tbody></table></div></>}{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button>{step >= 2 && <button className="button button-primary" onClick={() => { setStep(3); importRows(); }}><Check size={16} />Import {rows.length} rows</button>}</div></Modal>;
}

export default App;
