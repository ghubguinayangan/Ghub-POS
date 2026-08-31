
"use client";

import { useState } from "react";
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

const utangSchema = z.object({
  debtorName: z.string().min(2, "Name is required."),
  debtorPhone: z.string().min(1, "Phone number is required."),
  debtorEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
});

export type UtangFormValues = z.infer<typeof utangSchema>;

interface UtangDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  totalAmount: number;
  onConfirm: (values: UtangFormValues) => void;
}

export function UtangDialog({ isOpen, onOpenChange, totalAmount, onConfirm }: UtangDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UtangFormValues>({
    resolver: zodResolver(utangSchema),
    defaultValues: {
      debtorName: "",
      debtorPhone: "",
      debtorEmail: "",
    },
  });

  const onSubmit = async (data: UtangFormValues) => {
    setIsLoading(true);
    onConfirm(data);
    setIsLoading(false);
    onOpenChange(false);
  };

   const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process as Utang (Debt)</DialogTitle>
          <DialogDescription>
            Record a new debt for the amount of <span className="font-bold text-primary">{formatToPHP(totalAmount)}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="debtorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debtor's Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="debtorPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="09123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="debtorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Debt
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
