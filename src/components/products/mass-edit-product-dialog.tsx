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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/placeholder-data";
import { Loader2 } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { useSettings } from "@/context/settings-context";

const massUpdateSchema = z.object({
  updateCategory: z.boolean().default(false),
  updatePrice: z.boolean().default(false),
  updateStock: z.boolean().default(false),
  category: z.string().optional(),
  price: z.coerce.number().optional(),
  stock: z.coerce.number().int().optional(),
}).superRefine((data, ctx) => {
    if (data.updateCategory && !data.category) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a category.",
            path: ["category"],
        });
    }
    if (data.updatePrice && (data.price === undefined || data.price < 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid price.",
            path: ["price"],
        });
    }
    if (data.updateStock && (data.stock === undefined || data.stock < 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid stock quantity.",
            path: ["stock"],
        });
    }
    if (!data.updateCategory && !data.updatePrice && !data.updateStock) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "You must select at least one field to update.",
            path: ["updateCategory"], 
        });
    }
});


export type MassUpdateValues = {
    category?: string;
    price?: number;
    stock?: number;
};

interface MassEditProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categories: Category[];
  onProductsUpdated: (updates: MassUpdateValues) => void;
  selectedCount: number;
}

export function MassEditProductDialog({ isOpen, onOpenChange, categories, onProductsUpdated, selectedCount }: MassEditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const form = useForm<z.infer<typeof massUpdateSchema>>({
    resolver: zodResolver(massUpdateSchema),
    defaultValues: {
        updateCategory: false,
        updatePrice: false,
        updateStock: false,
        price: undefined,
        stock: undefined,
    },
  });

  const { watch } = form;
  const watchUpdateCategory = watch("updateCategory");
  const watchUpdatePrice = watch("updatePrice");
  const watchUpdateStock = watch("updateStock");


  const onSubmit = async (data: z.infer<typeof massUpdateSchema>) => {
    setIsLoading(true);

    const updates: MassUpdateValues = {};
    if (data.updateCategory) updates.category = data.category;
    if (data.updatePrice) updates.price = data.price;
    if (data.updateStock) updates.stock = data.stock;
    
    onProductsUpdated(updates);
    
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
          <DialogTitle>Mass Edit Products</DialogTitle>
          <DialogDescription>
            Update fields for {selectedCount} selected product(s). Only checked fields will be updated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             
            <div className="space-y-2 p-4 border rounded-md">
                <div className="flex items-center space-x-2">
                    <FormField
                        control={form.control}
                        name="updateCategory"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">Change Category</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>
                {watchUpdateCategory && (
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a new category" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
             
            <div className="space-y-2 p-4 border rounded-md">
                 <div className="flex items-center space-x-2">
                    <FormField
                        control={form.control}
                        name="updatePrice"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">Change Price</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>
                {watchUpdatePrice && (
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="Set new price" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>

            {settings.enableStockTracking && (
              <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex items-center space-x-2">
                      <FormField
                          control={form.control}
                          name="updateStock"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                      <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                      />
                                  </FormControl>
                                  <FormLabel className="font-normal">Change Stock</FormLabel>
                              </FormItem>
                          )}
                      />
                  </div>
                  {watchUpdateStock && (
                      <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                              <FormItem>
                                  <FormControl>
                                      <Input type="number" placeholder="Set new stock quantity" {...field} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  )}
              </div>
            )}
            
            <FormMessage>{form.formState.errors.updateCategory?.message}</FormMessage>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Products
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
