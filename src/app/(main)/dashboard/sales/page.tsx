"use client";

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, Undo2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sale } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefundDialog } from '@/components/sales/refund-dialog';
import { useProducts } from '@/context/product-context';
import { useSales } from '@/context/sales-context';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';

export default function SalesPage() {
  const { sales, setSales } = useSales();
  const { setProducts } = useProducts();
  const { toast } = useToast();
  const { settings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isRefundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedSaleForRefund, setSelectedSaleForRefund] = useState<Sale | null>(null);

  const cashiers = useMemo(() => ["All", ...Array.from(new Set(sales.map(s => s.cashier)))], [sales]);
  const paymentMethods = useMemo(() => ["All", "Cash", "GCash", "PayMaya", "Bank", "Utang"], []);
  const statuses = useMemo(() => ["All", "Completed", "Partially Refunded", "Refunded"], []);


  const filteredSales = useMemo(() => {
    let results = sales;

    if (selectedCashier !== 'All') {
      results = results.filter(s => s.cashier === selectedCashier);
    }

    if (selectedPayment !== 'All') {
      results = results.filter(s => s.paymentMethod === selectedPayment);
    }

    if (selectedStatus !== 'All') {
      results = results.filter(s => s.status === selectedStatus);
    }
    
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(sale => 
        sale.id.toLowerCase().includes(lowercasedQuery) ||
        sale.date.toLocaleDateString().toLowerCase().includes(lowercasedQuery) ||
        sale.cashier.toLowerCase().includes(lowercasedQuery) ||
        sale.paymentMethod.toLowerCase().includes(lowercasedQuery) ||
        sale.total.toString().includes(lowercasedQuery)
      );
    }
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [searchQuery, selectedCashier, selectedPayment, selectedStatus, sales]);

  const handleRefundClick = (sale: Sale) => {
    if (sale.status === 'Refunded') {
        toast({
            variant: "destructive",
            title: "Already Refunded",
            description: "This transaction has already been fully refunded.",
        });
        return;
    }
    setSelectedSaleForRefund(sale);
    setRefundDialogOpen(true);
  };

  const handleConfirmRefund = (saleToRefund: Sale, itemsToRefund: { productId: string, quantity: number, price: number }[], reason: string) => {
    // 1. Update product stock if stock tracking is enabled
    if (settings.enableStockTracking) {
        setProducts(currentProducts => {
            const updatedProducts = [...currentProducts];
            itemsToRefund.forEach(refundItem => {
                const productIndex = updatedProducts.findIndex(p => p.id === refundItem.productId);
                if (productIndex !== -1) {
                    updatedProducts[productIndex].stock += refundItem.quantity;
                }
            });
            return updatedProducts;
        });
    }

    const refundAmount = itemsToRefund.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 2. Update sale status
    setSales(currentSales => currentSales.map(s => {
        if (s.id === saleToRefund.id) {
            const newRefundedAmount = (s.refundedAmount || 0) + refundAmount;
            
            // A full refund is when the refunded amount is equal to or greater than the original total (with a small tolerance)
            const isFullRefund = newRefundedAmount >= (s.total - 0.01);

            return {
                ...s,
                status: isFullRefund ? 'Refunded' : 'Partially Refunded',
                refundedAmount: newRefundedAmount,
            };
        }
        return s;
    }));

    toast({
        title: "Refund Processed",
        description: `${formatToPHP(refundAmount)} has been refunded. Reason: ${reason}.`,
    });
    setRefundDialogOpen(false);
  };

  const getBadgeVariant = (status: Sale['status']): 'secondary' | 'outline' | 'destructive' | 'default' => {
      switch (status) {
          case 'Completed': return 'secondary';
          case 'Partially Refunded': return 'outline';
          case 'Refunded': return 'destructive';
          default: return 'secondary';
      }
  }

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Search, filter, and review all sales recorded in the system.
          </CardDescription>
           <div className="mt-4 flex flex-col gap-4 sm:flex-row flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="AI Search (e.g., 'sales by Jane last Tuesday')"
                className="w-full rounded-lg bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                    <TableCell>
                        <div className="font-mono text-xs font-semibold">{sale.id}</div>
                        <div className="text-sm text-muted-foreground">{sale.date.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{sale.cashier}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant={sale.paymentMethod === 'Cash' ? 'secondary' : 'outline'}>
                        {sale.paymentMethod}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant={getBadgeVariant(sale.status)}>{sale.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="font-medium">{formatToPHP(sale.total)}</div>
                        {sale.refundedAmount ? (
                            <div className="text-xs text-destructive">{`-${formatToPHP(sale.refundedAmount)}`}</div>
                        ) : null}
                         <div className="text-xs text-muted-foreground md:hidden">
                            <Badge variant={getBadgeVariant(sale.status)}>{sale.status}</Badge>
                         </div>
                    </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleRefundClick(sale)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Refund
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    {selectedSaleForRefund && (
        <RefundDialog
            isOpen={isRefundDialogOpen}
            onOpenChange={setRefundDialogOpen}
            sale={selectedSaleForRefund}
            onConfirmRefund={handleConfirmRefund}
        />
    )}
    </>
  );
}
