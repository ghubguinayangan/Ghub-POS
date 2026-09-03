
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Banknote,
  Receipt,
  TrendingUp,
  PackageX,
  AlertTriangle,
  Users,
  Wallet,
  TrendingDown,
  RefreshCw,
  CloudOff,
  Undo2,
  Box,
  Clock,
  CircleCheck,
} from "lucide-react";
import { formatToPHP, formatNumberPH } from "@/lib/currency";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
  CartesianGrid,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/settings-context";
import { useDevice } from "@/context/device-context";
import { DeviceSelect } from "@/components/main/device-select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getDailySummaries,
  getInventory,
  getSales,
  getUsers,
  getExpenses,
  getUtang,
  aggregateTotals,
  buildTrendSeries,
  aggregateCategorySales,
  aggregateExpensesByCategory,
  aggregateUnpaidUtang,
  aggregateTopProducts,
  aggregateStaffPerformance,
  localDateKey,
  type DailySummaryRow,
  type InventoryRow,
  type SaleRow,
  type GhubUserRow,
  type ExpenseRow,
  type UtangRow,
} from "@/lib/ghub-data";

type DateRangePreset = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month";

interface DateRange {
  start: string;
  end: string;
  label: string;
}

function toDateKey(d: Date): string {
  return localDateKey(d);
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return toDateKey(d);
}

function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = toDateKey(now);

  switch (preset) {
    case "today": {
      return { start: today, end: today, label: "Today" };
    }
    case "yesterday": {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const key = toDateKey(d);
      return { start: key, end: key, label: "Yesterday" };
    }
    case "this-week": {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return { start: toDateKey(d), end: today, label: "This Week" };
    }
    case "last-week": {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff - 7);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { start: toDateKey(d), end: toDateKey(weekEnd), label: "Last Week" };
    }
    case "this-month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toDateKey(d), end: today, label: "This Month" };
    }
    case "last-month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toDateKey(d), end: toDateKey(end), label: "Last Month" };
    }
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function DashboardPage() {
  const { settings } = useSettings();
  const { selectedDeviceId, deviceIds, isLoading: deviceLoading } = useDevice();

  const [timeRange, setTimeRange] = useState<DateRangePreset>("today");
  const [leaderboardTimeRange, setLeaderboardTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [summaries, setSummaries] = useState<DailySummaryRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [utang, setUtang] = useState<UtangRow[]>([]);
  const [leaderboardSales, setLeaderboardSales] = useState<SaleRow[]>([]);
  const [users, setUsers] = useState<GhubUserRow[]>([]);

  const dateRange = getDateRange(timeRange);
  const endDate = dateRange.end;
  const startDate = dateRange.start;
  const timeRangeLabel = dateRange.label;

  const leaderboardDays = leaderboardTimeRange === "1d" ? 1 : leaderboardTimeRange === "30d" ? 30 : 7;
  const leaderboardStart = daysAgoKey(leaderboardDays);

  const loadDashboardData = useCallback(async () => {
    if (!selectedDeviceId) {
      setSummaries([]);
      setInventory([]);
      setExpenses([]);
      setUtang([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [summaryRows, inventoryRows, expenseRows, utangRows] = await Promise.all([
      getDailySummaries(selectedDeviceId, startDate, endDate),
      getInventory(selectedDeviceId),
      getExpenses(selectedDeviceId, startDate, endDate),
      getUtang(selectedDeviceId),
    ]);
    setSummaries(summaryRows);
    setInventory(inventoryRows);
    setExpenses(expenseRows);
    setUtang(utangRows);
    setIsLoading(false);
  }, [selectedDeviceId, startDate, endDate]);

  const loadLeaderboardData = useCallback(async () => {
    if (!selectedDeviceId) {
      setLeaderboardSales([]);
      setUsers([]);
      return;
    }
    const [salesRows, userRows] = await Promise.all([
      getSales(selectedDeviceId, leaderboardStart, endDate),
      getUsers(selectedDeviceId),
    ]);
    setLeaderboardSales(salesRows);
    setUsers(userRows);
  }, [selectedDeviceId, leaderboardStart, endDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTick]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData, refreshTick]);

  // --- Data Processing (from real synced data) ---

  const totals = useMemo(() => aggregateTotals(summaries), [summaries]);
  const trendData = useMemo(() => buildTrendSeries(summaries, startDate, endDate), [summaries, startDate, endDate]);
  const categorySalesData = useMemo(() => aggregateCategorySales(summaries), [summaries]);
  const allTopProducts = useMemo(() => aggregateTopProducts(summaries), [summaries]);
  const topSellingProducts = allTopProducts.slice(0, 5);
  const soldProductNames = useMemo(() => new Set(allTopProducts.map((p) => p.product)), [allTopProducts]);

  const lowStockProducts = useMemo(
    () =>
      inventory
        .filter((i) => i.current_stock > 0 && i.current_stock <= settings.lowStockThreshold)
        .sort((a, b) => a.current_stock - b.current_stock)
        .slice(0, 5),
    [inventory, settings.lowStockThreshold]
  );

  const deadStock = useMemo(
    () => inventory.filter((i) => !soldProductNames.has(i.product_name)).slice(0, 5),
    [inventory, soldProductNames]
  );

  const leaderboardData = useMemo(
    () => aggregateStaffPerformance(leaderboardSales, users),
    [leaderboardSales, users]
  );

  const expensesByCategory = useMemo(() => aggregateExpensesByCategory(expenses), [expenses]);
  const totalUnpaidCredit = useMemo(() => aggregateUnpaidUtang(utang), [utang]);
  const avgTransactionValue = totals.transactions > 0 ? totals.totalRevenue / totals.transactions : 0;
  const outOfStockCount = inventory.filter((i) => i.current_stock <= 0).length;
  const lowStockAlertCount = inventory.filter((i) => i.current_stock > 0 && i.current_stock <= settings.lowStockThreshold).length;
  const totalStockAlerts = outOfStockCount + lowStockAlertCount;

  const stats = [
    { title: `Net Revenue (${timeRangeLabel})`, value: formatToPHP(totals.totalRevenue), icon: Banknote },
    { title: `Total Expenses (${timeRangeLabel})`, value: formatToPHP(totals.totalExpenses), icon: Wallet, inverted: true },
    {
      title: `Net Profit (${timeRangeLabel})`,
      value: formatToPHP(totals.netProfit),
      icon: totals.netProfit >= 0 ? TrendingUp : TrendingDown,
      inverted: totals.netProfit < 0,
    },
    { title: `Transactions (${timeRangeLabel})`, value: `${totals.transactions}`, icon: Receipt },
    { title: `Refunds (${timeRangeLabel})`, value: formatToPHP(totals.refunds), icon: Undo2, inverted: totals.refunds > 0 },
  ];

  const profitChartConfig = {
    Sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    Expenses: { label: "Expenses", color: "hsl(var(--chart-4))" },
    Profit: { label: "Profit", color: "hsl(var(--primary))" },
  };

  const categoryChartData = categorySalesData.map((c, i) => ({ ...c, fill: `hsl(var(--chart-${(i % 5) + 1}))` }));
  const categorySalesConfig = Object.fromEntries(
    categorySalesData.map((c, i) => [c.name, { label: c.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }])
  );

  const expenseChartData = expensesByCategory.categories.map((c, i) => ({ ...c, fill: `hsl(var(--chart-${(i % 5) + 1}))` }));
  const expenseCategoryConfig = Object.fromEntries(
    expensesByCategory.categories.map((c, i) => [c.name, { label: c.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }])
  );

  if (!deviceLoading && deviceIds.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CloudOff className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No synced data yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This dashboard reads live data synced from the G-hub POS mobile app. Open the app, go to
          Settings → Cloud Sync, and run a sync at least once — data will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Live data synced from your G-hub POS mobile app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeviceSelect />
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setRefreshTick((t) => t + 1)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Time Range</Label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as DateRangePreset)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className={`shrink-0 rounded-full p-2 ${stat.inverted ? "bg-destructive/10" : "bg-primary/10"}`}>
                <stat.icon className={`h-4 w-4 ${stat.inverted ? "text-destructive" : "text-primary"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className="truncate text-lg font-bold sm:text-2xl">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics — mirrors the mobile app's Dashboard section of the same name */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Detailed Analytics</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold sm:text-2xl">{formatNumberPH(totals.itemsSold)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total units for this period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold sm:text-2xl">{formatToPHP(avgTransactionValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per sale, this period</p>
            </CardContent>
          </Card>

          <Card className={totalStockAlerts > 0 ? "border-destructive" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock</CardTitle>
              {totalStockAlerts > 0 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CircleCheck className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold sm:text-2xl ${totalStockAlerts > 0 ? "text-destructive" : "text-green-600"}`}>
                {totalStockAlerts === 0 ? "Good" : `${totalStockAlerts} Alert${totalStockAlerts > 1 ? "s" : ""}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {outOfStockCount} out of stock, {lowStockAlertCount} low
              </p>
            </CardContent>
          </Card>

          {utang.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Credit</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold sm:text-2xl">{formatToPHP(totalUnpaidCredit)}</div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding utang balance</p>
              </CardContent>
            </Card>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Cost of Goods and ROI aren&apos;t shown here — the mobile app computes those from product cost data that
          isn&apos;t currently part of the sync.
        </p>
      </div>

      {/* Trend Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Showing data from {startDate} to {endDate}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={profitChartConfig} className="h-[300px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatToPHP(Number(value)).slice(0, -3)}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="Sales" type="monotone" fill="var(--color-Sales)" fillOpacity={0.4} stroke="var(--color-Sales)" stackId="a" />
                <Area dataKey="Expenses" type="monotone" fill="var(--color-Expenses)" fillOpacity={0.4} stroke="var(--color-Expenses)" stackId="b" />
                <Line dataKey="Profit" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across product categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ChartContainer config={categorySalesConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                  <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10">No sales recorded for this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Cost distribution across expense categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {expenseChartData.length > 0 ? (
              <ChartContainer config={expenseCategoryConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                  <Pie data={expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false}>
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10">No expenses recorded for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Product Performance</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>Top Selling Products</CardTitle>
            </div>
            <CardDescription>Highest sales volume in this period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topSellingProducts.length > 0 ? (
                topSellingProducts.map((product) => (
                  <li key={product.product} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium truncate">{product.product}</p>
                      <p className="text-sm text-muted-foreground">{formatToPHP(product.revenue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatNumberPH(product.quantity)}</p>
                      <p className="text-xs text-muted-foreground">units sold</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center">No sales recorded for this period.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Low Stock Products</CardTitle>
            </div>
            <CardDescription>Products that need to be restocked soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <li key={product.product_name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium truncate">{product.product_name}</p>
                    </div>
                    <Badge variant="secondary">
                      {product.current_stock} {product.unit} left
                    </Badge>
                  </li>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No products are low on stock.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-red-500" />
              <CardTitle>Dead Stock</CardTitle>
            </div>
            <CardDescription>In inventory, but not sold in this period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {deadStock.length > 0 ? (
                deadStock.map((product) => (
                  <li key={product.product_name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium truncate">{product.product_name}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-amber-700 dark:text-amber-400">
                      {product.current_stock} {product.unit} unsold
                    </span>
                  </li>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No dead stock found for this period.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Staff Performance</h2>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Staff Leaderboard</CardTitle>
              </div>
              <Select value={leaderboardTimeRange} onValueChange={setLeaderboardTimeRange}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">This Week</SelectItem>
                  <SelectItem value="30d">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Sales and transaction performance by cashier.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Net Sales</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((staff) => (
                    <TableRow key={staff.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{staff.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatToPHP(staff.sales)}</TableCell>
                      <TableCell className="text-right">{formatNumberPH(staff.transactions)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                      No sales recorded for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
