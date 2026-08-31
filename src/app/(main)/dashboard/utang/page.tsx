"use client";

import { useState, useMemo } from "react";
import { useUtang, type DebtTransaction } from "@/context/utang-context";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Search, FileDown, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RecordPaymentDialog } from "@/components/utang/record-payment-dialog";


export default function UtangPage() {
    const { debts, setDebts } = useUtang();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtTransaction | null>(null);

    const filteredDebts = useMemo(() => {
        let results = debts;

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = results.filter(debt =>
                debt.debtorName.toLowerCase().includes(lowercasedQuery) ||
                debt.debtorPhone.toLowerCase().includes(lowercasedQuery)
            );
        }

        return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [debts, searchQuery]);

    const handleRecordPaymentClick = (debt: DebtTransaction) => {
        if (debt.status === 'Paid') {
            toast({
                variant: "default",
                title: "Debt Already Paid",
                description: "This debt has already been fully paid.",
            });
            return;
        }
        setSelectedDebtForPayment(debt);
        setPaymentDialogOpen(true);
    };

    const handleConfirmPayment = (debtId: string, amount: number) => {
        setDebts(prevDebts => prevDebts.map(debt => {
            if (debt.id === debtId) {
                const newAmountPaid = debt.amountPaid + amount;
                const newStatus = newAmountPaid >= (debt.total - 0.01) ? 'Paid' : 'Partially Paid';
                toast({
                    title: "Payment Recorded",
                    description: `${formatToPHP(amount)} has been recorded for ${debt.debtorName}.`,
                });
                return { ...debt, amountPaid: newAmountPaid, status: newStatus };
            }
            return debt;
        }));
        setPaymentDialogOpen(false);
    };

    const handleMarkAsPaid = (debtId: string) => {
        setDebts(prev => prev.map(d => {
            if (d.id === debtId) {
                 toast({
                    title: "Debt Marked as Paid",
                    description: `The debt for ${d.debtorName} has been fully paid.`,
                });
                return { ...d, status: 'Paid', amountPaid: d.total };
            }
            return d;
        }));
    }

    const handleExport = () => {
        if (filteredDebts.length === 0) {
            toast({
                title: "No Data to Export",
                description: "There are no debt records to export with the current filters.",
            });
            return;
        }

        const headers = [
            "ID", "Date", "Debtor Name", "Debtor Phone", "Debtor Email",
            "Total", "Amount Paid", "Remaining Balance", "Status", "Sale ID"
        ];

        const csvRows = [
            headers.join(','),
            ...filteredDebts.map(debt => {
                const remaining = debt.total - debt.amountPaid;
                // Escape commas in names by wrapping in quotes
                const debtorName = `"${debt.debtorName.replace(/"/g, '""')}"`; 
                const row = [
                    debt.id,
                    debt.date.toISOString(),
                    debtorName,
                    debt.debtorPhone,
                    debt.debtorEmail || '',
                    debt.total,
                    debt.amountPaid,
                    remaining.toFixed(2),
                    debt.status,
                    debt.saleId,
                ];
                return row.join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `utang_records_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Export Successful",
          description: `${filteredDebts.length} records have been exported to CSV.`,
        });
    };

    const handleImport = () => {
        toast({
            title: "Feature Coming Soon",
            description: "Importing records from a file will be available in a future update.",
        });
    };

    const getBadgeVariant = (status: 'Unpaid' | 'Partially Paid' | 'Paid'): 'destructive' | 'outline' | 'secondary' => {
        switch (status) {
            case 'Unpaid': return 'destructive';
            case 'Partially Paid': return 'outline';
            case 'Paid': return 'secondary';
            default: return 'secondary';
        }
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Utang Management</h1>
                        <p className="text-muted-foreground">Track, export, and manage all outstanding debts.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export Records
                        </Button>
                        <Button variant="outline" onClick={handleImport}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Records
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Debt Records</CardTitle>
                        <CardDescription>
                            Track and manage all outstanding debts.
                        </CardDescription>
                        <div className="pt-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                type="search"
                                placeholder="Search by name or phone..."
                                className="w-full rounded-lg bg-background pl-8 sm:w-[300px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                                    <TableHead>Debtor</TableHead>
                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Owed</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDebts.length > 0 ? filteredDebts.map((debt) => (
                                    <TableRow key={debt.id}>
                                        <TableCell className="hidden sm:table-cell">{debt.date.toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{debt.debtorName}</div>
                                            <div className="text-sm text-muted-foreground md:hidden">
                                                <a href={`tel:${debt.debtorPhone}`} className="hover:underline">
                                                    {debt.debtorPhone}
                                                </a>
                                            </div>
                                            <div className="text-xs text-muted-foreground sm:hidden">
                                                {debt.date.toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <a href={`tel:${debt.debtorPhone}`} className="hover:underline">
                                                {debt.debtorPhone}
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getBadgeVariant(debt.status)}>{debt.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatToPHP(debt.total - debt.amountPaid)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleRecordPaymentClick(debt)} disabled={debt.status === 'Paid'}>
                                                        Record Payment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleMarkAsPaid(debt.id)} disabled={debt.status === 'Paid'}>
                                                        Mark as Fully Paid
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            {searchQuery ? "No results found." : "No debt records found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <RecordPaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                debt={selectedDebtForPayment}
                onConfirmPayment={handleConfirmPayment}
            />
        </>
    )
}
