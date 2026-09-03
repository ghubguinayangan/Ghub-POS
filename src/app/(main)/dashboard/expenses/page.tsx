"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatToPHP } from "@/lib/currency";
import { formatDatePH } from "@/lib/date";
import { Input } from '@/components/ui/input';
import { CloudOff, RefreshCw, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useDevice } from '@/context/device-context';
import { DeviceSelect } from '@/components/main/device-select';
import { getExpenses, getUsers, localDateKey, type ExpenseRow, type GhubUserRow } from '@/lib/ghub-data';

type PeriodPreset = "7d" | "30d" | "90d" | "all";

function toDateKey(d: Date): string {
  return localDateKey(d);
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return toDateKey(d);
}

function getPeriodRange(preset: PeriodPreset): { start: string; end: string } {
  const end = toDateKey(new Date());
  if (preset === "all") return { start: "2000-01-01", end };
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return { start: daysAgoKey(days), end };
}

export default function ExpensesPage() {
  const { selectedDeviceId, deviceIds, isLoading: deviceLoading } = useDevice();

  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [users, setUsers] = useState<GhubUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const load = useCallback(async () => {
    if (!selectedDeviceId) {
      setExpenses([]);
      setUsers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { start, end } = getPeriodRange(period);
    const [expenseRows, userRows] = await Promise.all([
      getExpenses(selectedDeviceId, start, end),
      getUsers(selectedDeviceId),
    ]);
    setExpenses(expenseRows);
    setUsers(userRows);
    setIsLoading(false);
  }, [selectedDeviceId, period]);

  useEffect(() => {
    load();
  }, [load]);

  const recordedByName = useMemo(() => {
    const byId = new Map(users.map((u) => [u.user_id, u.full_name || u.username || u.user_id]));
    return (userId: string) => (userId ? byId.get(userId) || userId : 'Unknown');
  }, [users]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(expenses.map((e) => e.category || 'Other')))],
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    let results = expenses;

    if (selectedCategory !== 'All') {
      results = results.filter((e) => (e.category || 'Other') === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((expense) =>
        (expense.category || '').toLowerCase().includes(q) ||
        (expense.description || '').toLowerCase().includes(q) ||
        (expense.notes || '').toLowerCase().includes(q) ||
        recordedByName(expense.created_by).toLowerCase().includes(q) ||
        String(expense.amount).includes(q)
      );
    }

    return [...results].sort(
      (a, b) => new Date(b.expense_date || b.created_at || 0).getTime() - new Date(a.expense_date || a.created_at || 0).getTime()
    );
  }, [searchQuery, selectedCategory, expenses, recordedByName]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if (!deviceLoading && deviceIds.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CloudOff className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No synced data yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This page mirrors the expenses recorded in the G-hub POS mobile app. Open the app, go to
          Settings → Cloud Sync, and run a sync at least once — expenses will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Read-only view of the expenses synced from your mobile app.</p>
        </div>
        <div className="flex items-center gap-2">
          <DeviceSelect />
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>
            {filteredExpenses.length} record(s) totaling {formatToPHP(totalAmount)}
          </CardDescription>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search expenses..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="hidden sm:table-cell">Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                <TableRow key={expense.expense_id}>
                  <TableCell>
                    {expense.expense_date
                      ? formatDatePH(expense.expense_date)
                      : expense.created_at
                        ? formatDatePH(expense.created_at)
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category || 'Other'}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description || expense.notes || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{recordedByName(expense.created_by)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatToPHP(expense.amount)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isLoading ? "Loading..." : "No results found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
