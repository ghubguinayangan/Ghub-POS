"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { formatToPHP } from "@/lib/currency";
import type { DebtTransaction } from "@/context/utang-context";
import { Alert, AlertDescription } from "../ui/alert";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  debt: DebtTransaction | null;
  onConfirmPayment: (debtId: string, amount: number) => void;
}

export function RecordPaymentDialog({ isOpen, onOpenChange, debt, onConfirmPayment }: RecordPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const remainingBalance = debt ? debt.total - debt.amountPaid : 0;

  const paymentSchema = z.object({
    amount: z.coerce
      .number()
      .positive("Amount must be greater than zero.")
      .max(remainingBalance, `Amount cannot exceed the remaining balance of ${formatToPHP(remainingBalance)}.`),
  });
  
  type PaymentFormValues = z.infer<typeof paymentSchema>;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);
  
  const onSubmit = async (data: PaymentFormValues) => {
    if (!debt) return;
    setIsLoading(true);
    onConfirmPayment(debt.id, data.amount);
    setIsLoading(false);
    onOpenChange(false);
  };

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for {debt.debtorName}</DialogTitle>
          <DialogDescription>
            Record a partial or full payment for this debt.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <Alert>
                <AlertDescription className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <span className="font-bold">{formatToPHP(remainingBalance)}</span>
                </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
