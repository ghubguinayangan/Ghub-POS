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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatToPHP } from "@/lib/currency";
import { Input } from '@/components/ui/input';
import { CloudOff, RefreshCw, Search, Package } from 'lucide-react';
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
import { getSales, getUsers, localDateKey, type SaleRow, type GhubUserRow } from '@/lib/ghub-data';
import { formatDateTimePH } from '@/lib/date';

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

function paymentLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Cash';
    case 'gcash': return 'GCash';
    case 'paymaya': return 'PayMaya';
    case 'bank_transfer': return 'Bank Transfer';
    case 'card': return 'Card';
    case 'utang': return 'Utang';
    default: return method || 'Unknown';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'refunded': return 'Refunded';
    case 'pending': return 'Pending';
    default: return 'Completed';
  }
}

function statusBadgeVariant(status: string): 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'refunded': return 'destructive';
    case 'pending': return 'outline';
    default: return 'secondary';
  }
}

export default function SalesPage() {
  const { selectedDeviceId, deviceIds, isLoading: deviceLoading } = useDevice();

  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [users, setUsers] = useState<GhubUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);

  const load = useCallback(async () => {
    if (!selectedDeviceId) {
      setSales([]);
      setUsers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { start, end } = getPeriodRange(period);
    const [salesRows, userRows] = await Promise.all([
      getSales(selectedDeviceId, start, end),
      getUsers(selectedDeviceId),
    ]);
    setSales(salesRows);
    setUsers(userRows);
    setIsLoading(false);
  }, [selectedDeviceId, period]);

  useEffect(() => {
    load();
  }, [load]);

  const cashierName = useMemo(() => {
    const byId = new Map(users.map((u) => [u.user_id, u.full_name || u.username || u.user_id]));
    return (cashierId: string | null) => (cashierId ? byId.get(cashierId) || cashierId : 'Unknown');
  }, [users]);

  const cashiers = useMemo(
    () => ["All", ...Array.from(new Set(sales.map((s) => cashierName(s.cashier_id))))],
    [sales, cashierName]
  );
  const paymentMethods = useMemo(
    () => ["All", ...Array.from(new Set(sales.map((s) => paymentLabel(s.payment_method))))],
    [sales]
  );
  const statuses = ["All", "Completed", "Pending", "Refunded"];

  const filteredSales = useMemo(() => {
    let results = sales;

    if (selectedCashier !== 'All') {
      results = results.filter((s) => cashierName(s.cashier_id) === selectedCashier);
    }
    if (selectedPayment !== 'All') {
      results = results.filter((s) => paymentLabel(s.payment_method) === selectedPayment);
    }
    if (selectedStatus !== 'All') {
      results = results.filter((s) => statusLabel(s.payment_status) === selectedStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((sale) =>
        (sale.sale_number || sale.sale_id).toLowerCase().includes(q) ||
        (sale.sale_date || '').toLowerCase().includes(q) ||
        cashierName(sale.cashier_id).toLowerCase().includes(q) ||
        paymentLabel(sale.payment_method).toLowerCase().includes(q) ||
        String(sale.total_amount).includes(q)
      );
    }

    return [...results].sort(
      (a, b) => new Date(b.created_at || b.sale_date || 0).getTime() - new Date(a.created_at || a.sale_date || 0).getTime()
    );
  }, [searchQuery, selectedCashier, selectedPayment, selectedStatus, sales, cashierName]);

  if (!deviceLoading && deviceIds.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CloudOff className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No synced data yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This page mirrors the sales recorded in the G-hub POS mobile app. Open the app, go to
          Settings → Cloud Sync, and run a sync at least once — sales will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">Read-only view of the sales synced from your mobile app.</p>
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
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Search, filter, and review all sales synced from the mobile app.
          </CardDescription>
           <div className="mt-4 flex flex-col gap-4 sm:flex-row flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by transaction, date, cashier, payment, amount"
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
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Cashier" />
              </SelectTrigger>
              <SelectContent>
                {cashiers.map(cashier => (
                  <SelectItem key={cashier} value={cashier}>{cashier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Payment" />
              </SelectTrigger>
              <SelectContent>
                 {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead className="hidden sm:table-cell">Cashier</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? filteredSales.map((sale) => (
                <TableRow
                  key={sale.sale_id}
                  className="cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                    <TableCell>
                        <div className="font-mono text-xs font-semibold">{sale.sale_number || sale.sale_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {sale.created_at ? formatDateTimePH(sale.created_at) : sale.sale_date}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Package className="h-3 w-3" />
                          {sale.items_sold?.length
                            ? `${sale.items_sold.length} item${sale.items_sold.length > 1 ? 's' : ''} - tap to view`
                            : 'No item details'}
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{cashierName(sale.cashier_id)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'}>
                        {paymentLabel(sale.payment_method)}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant={statusBadgeVariant(sale.payment_status)}>{statusLabel(sale.payment_status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="font-medium">{formatToPHP(sale.total_amount)}</div>
                         <div className="text-xs text-muted-foreground md:hidden">
                            <Badge variant={statusBadgeVariant(sale.payment_status)}>{statusLabel(sale.payment_status)}</Badge>
                         </div>
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

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {selectedSale?.sale_number || selectedSale?.sale_id}
            </DialogTitle>
            <DialogDescription>
              {selectedSale?.created_at
                ? formatDateTimePH(selectedSale.created_at)
                : selectedSale?.sale_date}
              {' - '}
              {cashierName(selectedSale?.cashier_id ?? null)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedSale?.items_sold?.length ? (
              <div className="rounded-md border divide-y">
                {selectedSale.items_sold.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">{item.product}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.qty} x {formatToPHP(item.price)}
                      </div>
                    </div>
                    <div className="font-medium">{formatToPHP(item.qty * item.price)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No item details were synced for this sale.
              </p>
            )}

            <div className="flex items-center justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span>{selectedSale ? formatToPHP(selectedSale.total_amount) : ''}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
