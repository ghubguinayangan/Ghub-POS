
"use client";

import { useState, useMemo } from "react";
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
  Undo2,
  FileDown,
  Wallet,
  Landmark,
  TrendingDown,
} from "lucide-react";
import { formatToPHP } from "@/lib/currency";
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
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
  CartesianGrid,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, format, isWithinInterval, startOfDay } from 'date-fns';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { USERS } from "@/lib/placeholder-data";
import { useProducts } from "@/context/product-context";
import { useSales } from "@/context/sales-context";
import { useExpenses } from "@/context/expense-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";


export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedStaff, setSelectedStaff] = useState("All");
  const [leaderboardTimeRange, setLeaderboardTimeRange] = useState("7d");
  
  const { settings } = useSettings();
  const { products } = useProducts();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { toast } = useToast();

  const handleExportPDF = () => {
    toast({
        title: "Exporting to PDF...",
        description: "This is a mock feature for demonstration purposes.",
    });
  };

  const handleExportExcel = () => {
      toast({
          title: "Exporting to Excel...",
          description: "This is a mock feature for demonstration purposes.",
      });
  };


  // --- Data Processing ---

  const staffMembers = useMemo(() => ["All", ...Array.from(new Set(sales.map(s => s.cashier)))], [sales]);

  const interval = useMemo(() => {
    const days = parseInt(timeRange.replace('d', ''));
    return { end: new Date(), start: subDays(new Date(), days - 1) };
  }, [timeRange]);

  const timeFilteredSales = useMemo(() => {
    return sales.filter(s => isWithinInterval(new Date(s.date), interval));
  }, [sales, interval]);

  const timeFilteredExpenses = useMemo(() => {
    return expenses.filter(e => isWithinInterval(new Date(e.date), interval));
  }, [expenses, interval]);
  
  const dashboardFilteredSales = useMemo(() => {
    if (selectedStaff === 'All') {
        return timeFilteredSales;
    }
    return timeFilteredSales.filter(s => s.cashier === selectedStaff);
  }, [timeFilteredSales, selectedStaff]);
  
  const netRevenueForPeriod = dashboardFilteredSales.reduce((sum, sale) => sum + sale.total - (sale.refundedAmount || 0), 0);
  const totalExpensesForPeriod = timeFilteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfitForPeriod = netRevenueForPeriod - totalExpensesForPeriod;
  const completedTransactionsForPeriod = dashboardFilteredSales.filter(s => s.status !== 'Refunded');
  
  const stats = [
    { title: `Net Revenue (${timeRange})`, value: formatToPHP(netRevenueForPeriod), icon: Banknote },
    { title: `Total Expenses (${timeRange})`, value: formatToPHP(totalExpensesForPeriod), icon: Wallet, inverted: true },
    { title: `Net Profit (${timeRange})`, value: formatToPHP(netProfitForPeriod), icon: netProfitForPeriod >= 0 ? TrendingUp : TrendingDown, inverted: netProfitForPeriod < 0 },
    { title: `Transactions (${timeRange})`, value: `+${completedTransactionsForPeriod.length}`, icon: Receipt },
  ];

  // Sales & Profit Trend Chart Data
  const salesByDay = dashboardFilteredSales.reduce((acc, sale) => {
      const day = format(new Date(sale.date), "MMM d");
      const netSale = sale.total - (sale.refundedAmount || 0);
      acc[day] = (acc[day] || 0) + netSale;
      return acc;
    }, {} as Record<string, number>);

  const expensesByDay = timeFilteredExpenses.reduce((acc, expense) => {
      const day = format(new Date(expense.date), "MMM d");
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
  }, {} as Record<string, number>);

  const profitTrendData = Array.from({ length: parseInt(timeRange.replace('d', '')) }, (_, i) => {
      const d = subDays(interval.end, i);
      const day = format(d, "MMM d");
      const sales = salesByDay[day] || 0;
      const expenses = expensesByDay[day] || 0;
      return { 
          date: day, 
          Sales: sales,
          Expenses: expenses,
          Profit: sales - expenses,
      };
    }).reverse();
  
  const profitChartConfig = {
    Sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    Expenses: { label: "Expenses", color: "hsl(var(--chart-4))" },
    Profit: { label: "Profit", color: "hsl(var(--primary))" },
  };

  // Sales by Category
  const salesByCategory = dashboardFilteredSales.flatMap(s => s.items).reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
        const category = product.category;
        acc[category] = (acc[category] || 0) + (item.price * item.quantity);
    }
    return acc;
  }, {} as Record<string, number>);

  const categorySalesData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value, fill: `hsl(var(--chart-${Object.keys(salesByCategory).indexOf(name) + 1}))` }));
  const categorySalesConfig = Object.fromEntries(Object.keys(salesByCategory).map((key, i) => [key, {label: key, color: `hsl(var(--chart-${i+1}))`}]))

  // Expenses by Category
  const expensesByCategory = timeFilteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryExpenseData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value, fill: `hsl(var(--chart-${Object.keys(expensesByCategory).indexOf(name) + 1}))` }));
  const categoryExpenseConfig = Object.fromEntries(Object.keys(expensesByCategory).map((key, i) => [key, {label: key, color: `hsl(var(--chart-${i+1}))`}]))

  // Product Performance
  const productSales = dashboardFilteredSales.filter(s => s.status !== 'Refunded').flatMap(s => s.items).reduce((acc, item) => {
    acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topSellingProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return { ...product!, quantitySold: quantity };
    });
  
  const soldProductIds = new Set(Object.keys(productSales));
  const deadStock = products.filter(p => !soldProductIds.has(p.id)).slice(0, 5);

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= settings.lowStockThreshold).sort((a,b) => a.stock - b.stock).slice(0, 5);

  // Staff Performance
  const leaderboardInterval = useMemo(() => {
    const end = new Date();
    let start;
    switch (leaderboardTimeRange) {
      case "1d":
        start = new Date();
        break;
      case "7d":
        start = subDays(new Date(), 6);
        break;
      case "30d":
        start = subDays(new Date(), 29);
        break;
      default:
        start = subDays(new Date(), 6);
    }
    return { start: startOfDay(start), end };
  }, [leaderboardTimeRange]);

  const leaderboardFilteredSales = useMemo(() => {
    // We filter from all sales, not timeFilteredSales which is for the main dashboard
    return sales.filter(s => isWithinInterval(new Date(s.date), leaderboardInterval));
  }, [sales, leaderboardInterval]);


  const staffPerformance = leaderboardFilteredSales.reduce((acc, sale) => {
    const cashierName = sale.cashier;
    if (!acc[cashierName]) {
        acc[cashierName] = {
            name: cashierName,
            sales: 0,
            transactions: 0,
        };
    }
    acc[cashierName].sales += sale.total - (sale.refundedAmount || 0);
    acc[cashierName].transactions += 1;
    return acc;
  }, {} as Record<string, {name: string, sales: number, transactions: number}>);
  
  const userMap = new Map(USERS.map(u => [u.name, u]));

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
}

  const leaderboardData = Object.values(staffPerformance)
    .sort((a, b) => b.sales - a.sales)
    .map(staff => ({
      ...staff,
      avatarUrl: userMap.get(staff.name)?.avatarUrl,
      initials: getInitials(staff.name)
    }));


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
                An overview of your store's performance. Charts are interactive on hover.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Export Excel
            </Button>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Staff</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                   {staffMembers.map(staff => (
                       <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                   ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.inverted ? "text-destructive" : ""}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Sales Trend Chart */}
        <Card>
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Showing data from {format(interval.start, "MMM d")} to {format(interval.end, "MMM d, yyyy")}.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={profitChartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <AreaChart data={profitTrendData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatToPHP(Number(value)).slice(0,-3)}/>
                            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Area dataKey="Sales" type="monotone" fill="var(--color-Sales)" fillOpacity={0.4} stroke="var(--color-Sales)" stackId="a" />
                             <Area dataKey="Expenses" type="monotone" fill="var(--color-Expenses)" fillOpacity={0.4} stroke="var(--color-Expenses)" stackId="b"/>
                            <Line dataKey="Profit" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
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
                 <ChartContainer config={categorySalesConfig} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                            <Pie data={categorySalesData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false}>
                               {categorySalesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
         {/* Expenses by Category */}
        <Card>
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Cost distribution across expense categories.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                 <ChartContainer config={categoryExpenseConfig} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                            <Pie data={categoryExpenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false}>
                               {categoryExpenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
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
                    <CardDescription>Products with the highest sales volume in this period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                       {topSellingProducts.length > 0 ? topSellingProducts.map(product => (
                            <li key={product.id} className="flex items-center gap-4">
                                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md" data-ai-hint={product.imageHint} />
                                <div className="flex-1">
                                    <p className="font-medium truncate">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">{product.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{product.quantitySold.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">units sold</p>
                                </div>
                            </li>
                        )) : <p className="text-muted-foreground text-sm text-center">No sales recorded for this period.</p>}
                    </ul>
                </CardContent>
            </Card>

            {settings.enableStockTracking && (
                <>
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
                                {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                                    <li key={product.id} className="flex items-center gap-4">
                                        <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md" data-ai-hint={product.imageHint} />
                                        <div className="flex-1">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">{product.category}</p>
                                        </div>
                                        <Badge variant="secondary">{product.stock} in stock</Badge>
                                    </li>
                                )) : <p className="text-muted-foreground text-sm">No products are low on stock.</p>}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <PackageX className="h-5 w-5 text-red-500" />
                                <CardTitle>Dead Stock</CardTitle>
                            </div>
                            <CardDescription>Products that haven't sold in this period.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {deadStock.length > 0 ? deadStock.map(product => (
                                    <li key={product.id} className="flex items-center gap-4">
                                        <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md opacity-70" data-ai-hint={product.imageHint} />
                                        <div className="flex-1">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">{product.category}</p>
                                        </div>
                                        <Badge variant="outline">Stock: {product.stock}</Badge>
                                    </li>
                                )) : <p className="text-muted-foreground text-sm">No dead stock products found for this period.</p>}
                            </ul>
                        </CardContent>
                    </Card>
                </>
            )}
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
            <CardDescription>
              Sales and transaction performance by staff for the selected period. <br />
              Note: "Hours Worked vs. Sales" requires timesheet data not
              currently available.
            </CardDescription>
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
                {leaderboardData.map((staff) => (
                  <TableRow key={staff.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={staff.avatarUrl} />
                          <AvatarFallback>
                            {staff.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatToPHP(staff.sales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {staff.transactions.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
