import { supabase } from './supabase';

/**
 * Typed access to the ghub_* tables that the EYIR POS mobile app syncs into
 * Supabase (see mobile/supabase-migration.sql for the schema and
 * mobile/src/utils/syncService.ts for what gets sent). This website only
 * ever reads from these tables — there is no sync-back path from here to
 * the mobile app's local database.
 */

export interface DailySummaryRow {
  device_id: string;
  sale_date: string; // YYYY-MM-DD
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  transactions: number;
  items_sold: number;
  refunds: number;
  sales_by_category: { category: string; revenue: number }[];
  top_products: { product: string; quantity: number; revenue: number }[];
}

export interface InventoryRow {
  device_id: string;
  product_name: string;
  current_stock: number;
  unit: string;
  category: string | null;
  synced_at: string;
}

export interface SaleItemRow {
  product: string;
  qty: number;
  price: number;
}

export interface SaleRow {
  device_id: string;
  sale_id: string;
  sale_date: string | null;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  cashier_id: string | null;
  sale_number: string | null;
  created_at: string;
  items_sold: SaleItemRow[] | null;
}

export interface GhubUserRow {
  device_id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
}

export interface ExpenseRow {
  device_id: string;
  expense_id: string;
  expense_date: string | null;
  category: string;
  amount: number;
  description: string;
  notes: string;
  payment_method: string;
  created_by: string;
  created_at: string;
}

export interface UtangRow {
  device_id: string;
  utang_id: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string; // 'Pending' | 'Partial' | 'Paid' | 'Cancelled'
}

/** Every distinct device_id that has synced either a summary or inventory. */
export async function getDeviceIds(): Promise<string[]> {
  const [summaryRes, inventoryRes] = await Promise.all([
    supabase.from('ghub_daily_summary').select('device_id'),
    supabase.from('ghub_inventory_levels').select('device_id'),
  ]);

  const ids = new Set<string>();
  (summaryRes.data || []).forEach((r: any) => r.device_id && ids.add(r.device_id));
  (inventoryRes.data || []).forEach((r: any) => r.device_id && ids.add(r.device_id));

  // TEMP (remove once done debugging): hide emulator/dev-build devices from
  // the dashboard - they sync under a "TEST-" id instead of "POS-", see
  // generateDeviceId() in mobile/src/utils/syncService.ts. To remove: delete
  // this filter line so every synced device shows again.
  return Array.from(ids).filter((id) => !id.startsWith('TEST-')).sort();
}

export async function getDailySummaries(
  deviceId: string,
  startDate: string,
  endDate: string
): Promise<DailySummaryRow[]> {
  const { data, error } = await supabase
    .from('ghub_daily_summary')
    .select('*')
    .eq('device_id', deviceId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: true });

  if (error) {
    console.error('Failed to load daily summaries:', error.message);
    return [];
  }
  return (data || []) as DailySummaryRow[];
}

export async function getInventory(deviceId: string): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('ghub_inventory_levels')
    .select('*')
    .eq('device_id', deviceId)
    .order('current_stock', { ascending: true });

  if (error) {
    console.error('Failed to load inventory:', error.message);
    return [];
  }
  return (data || []) as InventoryRow[];
}

export async function getSales(
  deviceId: string,
  startDate: string,
  endDate: string
): Promise<SaleRow[]> {
  const { data, error } = await supabase
    .from('ghub_sales')
    .select('*')
    .eq('device_id', deviceId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate);

  if (error) {
    console.error('Failed to load sales:', error.message);
    return [];
  }
  return (data || []) as SaleRow[];
}

export async function getExpenses(
  deviceId: string,
  startDate: string,
  endDate: string
): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from('ghub_expenses')
    .select('*')
    .eq('device_id', deviceId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (error) {
    console.error('Failed to load expenses:', error.message);
    return [];
  }
  return (data || []) as ExpenseRow[];
}

/** Not date-filtered — outstanding credit is a running balance, same as the mobile app's own Credit metric. */
export async function getUtang(deviceId: string): Promise<UtangRow[]> {
  const { data, error } = await supabase
    .from('ghub_utang')
    .select('*')
    .eq('device_id', deviceId);

  if (error) {
    console.error('Failed to load utang:', error.message);
    return [];
  }
  return (data || []) as UtangRow[];
}

export async function getUsers(deviceId: string): Promise<GhubUserRow[]> {
  const { data, error } = await supabase
    .from('ghub_users')
    .select('*')
    .eq('device_id', deviceId);

  if (error) {
    console.error('Failed to load users:', error.message);
    return [];
  }
  return (data || []) as GhubUserRow[];
}

// --- Aggregation helpers -----------------------------------------------

export interface AggregatedTotals {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  transactions: number;
  itemsSold: number;
  refunds: number;
}

export function aggregateTotals(rows: DailySummaryRow[]): AggregatedTotals {
  return rows.reduce(
    (acc, r) => ({
      totalRevenue: acc.totalRevenue + Number(r.total_revenue || 0),
      totalExpenses: acc.totalExpenses + Number(r.total_expenses || 0),
      netProfit: acc.netProfit + Number(r.net_profit || 0),
      transactions: acc.transactions + Number(r.transactions || 0),
      itemsSold: acc.itemsSold + Number(r.items_sold || 0),
      refunds: acc.refunds + Number(r.refunds || 0),
    }),
    { totalRevenue: 0, totalExpenses: 0, netProfit: 0, transactions: 0, itemsSold: 0, refunds: 0 }
  );
}

/**
 * A Date's own calendar date as YYYY-MM-DD, in LOCAL time.
 * `Date.toISOString()` converts to UTC first, which silently shifts the date
 * by one day in any timezone ahead of UTC (e.g. UTC+8) — always use this
 * instead when the string is meant to represent "this calendar day".
 */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Every calendar date from start to end (inclusive), as YYYY-MM-DD. */
export function dateRangeKeys(startDate: string, endDate: string): string[] {
  const keys: string[] = [];
  const cursor = new Date(startDate + 'T00:00:00');
  const last = new Date(endDate + 'T00:00:00');
  while (cursor.getTime() <= last.getTime()) {
    keys.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

/** Trend series with every day in range present, zero-filled where no summary was synced. */
export function buildTrendSeries(rows: DailySummaryRow[], startDate: string, endDate: string) {
  const byDate = new Map(rows.map((r) => [r.sale_date, r]));
  return dateRangeKeys(startDate, endDate).map((date) => {
    const row = byDate.get(date);
    const sales = Number(row?.total_revenue || 0);
    const expenses = Number(row?.total_expenses || 0);
    return {
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Sales: sales,
      Expenses: expenses,
      Profit: sales - expenses,
    };
  });
}

export function aggregateCategorySales(rows: DailySummaryRow[]): { name: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const c of row.sales_by_category || []) {
      totals.set(c.category, (totals.get(c.category) || 0) + Number(c.revenue || 0));
    }
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface CategoryTotal {
  name: string;
  value: number;
}

/** Mirrors the mobile app's own UtangContext.getTotalUnpaid() exactly (same status filter, same sum). */
export function aggregateUnpaidUtang(utangRows: UtangRow[]): number {
  return utangRows
    .filter((u) => u.status === 'Pending' || u.status === 'Partial')
    .reduce((sum, u) => sum + Number(u.balance || 0), 0);
}

export function aggregateExpensesByCategory(expenses: ExpenseRow[]): { categories: CategoryTotal[]; total: number; count: number } {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const category = e.category || 'Other';
    totals.set(category, (totals.get(category) || 0) + Number(e.amount || 0));
  }
  const categories = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const total = categories.reduce((sum, c) => sum + c.value, 0);
  return { categories, total, count: expenses.length };
}

export function aggregateTopProducts(
  rows: DailySummaryRow[]
): { product: string; quantity: number; revenue: number }[] {
  const totals = new Map<string, { quantity: number; revenue: number }>();
  for (const row of rows) {
    for (const p of row.top_products || []) {
      const existing = totals.get(p.product) || { quantity: 0, revenue: 0 };
      totals.set(p.product, {
        quantity: existing.quantity + Number(p.quantity || 0),
        revenue: existing.revenue + Number(p.revenue || 0),
      });
    }
  }
  return Array.from(totals.entries())
    .map(([product, v]) => ({ product, ...v }))
    .sort((a, b) => b.quantity - a.quantity);
}

export interface StaffPerformance {
  name: string;
  sales: number;
  transactions: number;
}

/** Per-cashier totals from raw sales rows, with names resolved via ghub_users. */
export function aggregateStaffPerformance(sales: SaleRow[], users: GhubUserRow[]): StaffPerformance[] {
  const nameById = new Map(users.map((u) => [u.user_id, u.full_name || u.username || u.user_id]));
  const totals = new Map<string, StaffPerformance>();

  for (const sale of sales) {
    if (sale.payment_status === 'refunded' || sale.payment_status === 'pending') continue;
    const key = sale.cashier_id || 'unknown';
    const name = nameById.get(key) || (sale.cashier_id ? sale.cashier_id : 'Unknown');
    const existing = totals.get(key) || { name, sales: 0, transactions: 0 };
    existing.sales += Number(sale.total_amount || 0);
    existing.transactions += 1;
    totals.set(key, existing);
  }

  return Array.from(totals.values()).sort((a, b) => b.sales - a.sales);
}
