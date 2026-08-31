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
import { MoreHorizontal, Search, Settings, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useExpenses, type Expense } from '@/context/expense-context';
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog';
import { ManageExpenseCategoriesDialog } from '@/components/expenses/manage-expense-categories-dialog';

export default function ExpensesPage() {
    const { expenses, setExpenses, expenseCategories } = useExpenses();
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isManageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState(false);


    const filteredExpenses = useMemo(() => {
        let results = expenses;

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = results.filter(expense => 
                expense.category.toLowerCase().includes(lowercasedQuery) ||
                (expense.notes && expense.notes.toLowerCase().includes(lowercasedQuery)) ||
                expense.createdBy.toLowerCase().includes(lowercasedQuery) ||
                expense.amount.toString().includes(lowercasedQuery)
            );
        }
        
        return results;

    }, [searchQuery, expenses]);
    
    const handleDelete = (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        toast({
            title: "Expense Deleted",
            description: `The expense record has been removed.`,
        });
    }

  return (
    <>
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track and manage all your business expenses.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Record Expense
                    </Button>
                    <Button variant="outline" onClick={() => setManageCategoriesDialogOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Categories
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                <CardTitle>Expense Records</CardTitle>
                <CardDescription>
                    Review all recorded business expenses.
                </CardDescription>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search expenses..."
                        className="w-full rounded-lg bg-background pl-8"
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
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="hidden sm:table-cell">Recorded By</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell>{expense.date.toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                             <TableCell className="max-w-[200px] truncate">{expense.notes}</TableCell>
                            <TableCell className="hidden sm:table-cell">{expense.createdBy}</TableCell>
                            <TableCell className="text-right font-medium">
                                {formatToPHP(expense.amount)}
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
                                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                     <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(expense.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No results found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <AddExpenseDialog 
            isOpen={isAddDialogOpen}
            onOpenChange={setAddDialogOpen}
        />
        <ManageExpenseCategoriesDialog 
            isOpen={isManageCategoriesDialogOpen}
            onOpenChange={setManageCategoriesDialogOpen}
        />
    </>
  );
}
