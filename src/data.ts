export type Transaction = {
  id: string;
  title: string;
  category: string;
  amountMinor: number;
  kind: 'income' | 'expense';
  date: string;
  accountId: string;
};

export type Account = {
  id: string;
  name: string;
  type: 'Bank' | 'Cash' | 'Wallet' | 'Credit card';
  openingMinor: number;
  color: string;
};

export type Budget = {
  id: string;
  category: string | null;
  limitMinor: number;
};

export const categories = [
  'Food & dining', 'Home', 'Transport', 'Bills', 'Shopping', 'Health',
  'Entertainment', 'Travel', 'Personal care', 'Education', 'Salary',
  'Freelance', 'Other income', 'Other expense',
];

const monthDate = (offset: number, day: number) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  date.setDate(day);
  return date.toISOString().slice(0, 10);
};

export const initialAccounts: Account[] = [
  { id: 'acc-main', name: 'HDFC savings', type: 'Bank', openingMinor: 12450000, color: 'green' },
  { id: 'acc-wallet', name: 'Everyday wallet', type: 'Wallet', openingMinor: 850000, color: 'blue' },
  { id: 'acc-cash', name: 'Cash', type: 'Cash', openingMinor: 250000, color: 'yellow' },
];

export const initialTransactions: Transaction[] = [
  { id: 't01', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(0, 1), accountId: 'acc-main' },
  { id: 't02', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(0, 2), accountId: 'acc-main' },
  { id: 't03', title: 'Grocery run', category: 'Food & dining', amountMinor: 684500, kind: 'expense', date: monthDate(0, 4), accountId: 'acc-main' },
  { id: 't04', title: 'Metro card', category: 'Transport', amountMinor: 120000, kind: 'expense', date: monthDate(0, 5), accountId: 'acc-wallet' },
  { id: 't05', title: 'Electricity bill', category: 'Bills', amountMinor: 218000, kind: 'expense', date: monthDate(0, 6), accountId: 'acc-main' },
  { id: 't06', title: 'Lunch with Sam', category: 'Food & dining', amountMinor: 96000, kind: 'expense', date: monthDate(0, 7), accountId: 'acc-wallet' },
  { id: 't07', title: 'Streaming subscription', category: 'Entertainment', amountMinor: 64900, kind: 'expense', date: monthDate(0, 8), accountId: 'acc-main' },
  { id: 't08', title: 'Pharmacy', category: 'Health', amountMinor: 135000, kind: 'expense', date: monthDate(0, 10), accountId: 'acc-wallet' },
  { id: 't09', title: 'Weekend groceries', category: 'Food & dining', amountMinor: 432000, kind: 'expense', date: monthDate(0, 11), accountId: 'acc-main' },
  { id: 't10', title: 'Coffee shop', category: 'Food & dining', amountMinor: 28500, kind: 'expense', date: monthDate(0, 12), accountId: 'acc-wallet' },
  { id: 't11', title: 'Freelance project', category: 'Freelance', amountMinor: 1250000, kind: 'income', date: monthDate(0, 13), accountId: 'acc-main' },
  { id: 't12', title: 'Cab ride', category: 'Transport', amountMinor: 86000, kind: 'expense', date: monthDate(0, 14), accountId: 'acc-wallet' },
  { id: 't13', title: 'New headphones', category: 'Shopping', amountMinor: 349900, kind: 'expense', date: monthDate(-1, 21), accountId: 'acc-main' },
  { id: 't14', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(-1, 1), accountId: 'acc-main' },
  { id: 't15', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(-1, 2), accountId: 'acc-main' },
  { id: 't16', title: 'Groceries', category: 'Food & dining', amountMinor: 755000, kind: 'expense', date: monthDate(-1, 5), accountId: 'acc-main' },
  { id: 't17', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(-2, 1), accountId: 'acc-main' },
  { id: 't18', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(-2, 2), accountId: 'acc-main' },
  { id: 't19', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(-3, 1), accountId: 'acc-main' },
  { id: 't20', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(-3, 2), accountId: 'acc-main' },
  { id: 't21', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(-4, 1), accountId: 'acc-main' },
  { id: 't22', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(-4, 2), accountId: 'acc-main' },
  { id: 't23', title: 'Monthly salary', category: 'Salary', amountMinor: 8500000, kind: 'income', date: monthDate(-5, 1), accountId: 'acc-main' },
  { id: 't24', title: 'Apartment rent', category: 'Home', amountMinor: 2200000, kind: 'expense', date: monthDate(-5, 2), accountId: 'acc-main' },
];

export const initialBudgets: Budget[] = [
  { id: 'b1', category: null, limitMinor: 5000000 },
  { id: 'b2', category: 'Food & dining', limitMinor: 1500000 },
  { id: 'b3', category: 'Transport', limitMinor: 650000 },
  { id: 'b4', category: 'Bills', limitMinor: 500000 },
  { id: 'b5', category: 'Shopping', limitMinor: 600000 },
];
