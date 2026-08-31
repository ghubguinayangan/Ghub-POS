"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { Sale } from "@/lib/placeholder-data";
import { formatToPHP } from "@/lib/currency";
import { useProducts } from "@/context/product-context";
import { Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RefundItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  maxQuantity: number;
};

interface RefundDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale;
  onConfirmRefund: (
    saleToRefund: Sale,
    itemsToRefund: { productId: string; quantity: number, price: number }[],
    reason: string
  ) => void;
}

export function RefundDialog({
  isOpen,
  onOpenChange,
  sale,
  onConfirmRefund,
}: RefundDialogProps) {
  const { products } = useProducts();
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [reason, setReason] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        if (sale) {
            const items = sale.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                productId: item.productId,
                name: product?.name || 'Unknown Product',
                quantity: 0,
                price: item.price,
                maxQuantity: item.quantity,
                };
            });
            setRefundItems(items);
        }
        setReason("");
        setPin("");
        setShowPin(false);
    }
  }, [isOpen, sale, products]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setRefundItems(items => items.map(item => {
      if (item.productId === productId) {
        const qty = Math.max(0, Math.min(newQuantity, item.maxQuantity));
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setRefundItems(items => items.map(item => ({
        ...item,
        quantity: checked === true ? item.maxQuantity : 0
    })));
  }

  const selectionState = useMemo<'indeterminate' | boolean>(() => {
    if (refundItems.length === 0) return false;
    const allSelected = refundItems.every(item => item.quantity === item.maxQuantity);
    if (allSelected) return true;
    const someSelected = refundItems.some(item => item.quantity > 0);
    if (someSelected) return 'indeterminate';
    return false;
  }, [refundItems]);

  const totalRefundAmount = useMemo(() => {
    return refundItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [refundItems]);

  const handleSubmit = () => {
    if (showPin && pin !== '1234') {
        toast({
            variant: "destructive",
            title: "Invalid PIN",
            description: "The manager PIN is incorrect. Please try again.",
        });
        setPin(""); // Clear PIN on failed attempt
        return;
    }
    
    const itemsToProcess = refundItems.filter(item => item.quantity > 0)
        .map(({productId, quantity, price}) => ({productId, quantity, price}));
    
    onConfirmRefund(sale, itemsToProcess, reason);
  };
  
  const isValidForApproval = totalRefundAmount > 0 && reason !== "";
  const isValidForConfirmation = isValidForApproval && pin.length >= 4;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            For transaction ID: <span className="font-mono">{sale.id}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox id="select-all" 
                    checked={selectionState}
                    onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Select All Items
                </label>
            </div>
            <ScrollArea className="h-48 pr-4">
                <div className="space-y-4">
                {refundItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{formatToPHP(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                                className="h-8 w-14 text-center"
                                max={item.maxQuantity}
                                min={0}
                            />
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="refund-reason">
                        <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Damaged item">Damaged Item</SelectItem>
                        <SelectItem value="Wrong item">Wrong Item</SelectItem>
                        <SelectItem value="Customer changed mind">Customer Changed Mind</SelectItem>
                        <SelectItem value="Overcharge">Overcharge</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {showPin && (
                 <div className="space-y-2">
                    <Label htmlFor="manager-pin">Manager PIN</Label>
                    <Input id="manager-pin" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter PIN for approval" />
                </div>
            )}
             <Alert>
                <AlertTitle>Refund Summary</AlertTitle>
                <AlertDescription>
                    <div className="flex justify-between"><span>Total Refund:</span> <span className="font-bold">{formatToPHP(totalRefundAmount)}</span></div>
                    <div className="flex justify-between"><span>Original Payment:</span> <span className="font-medium">{sale.paymentMethod}</span></div>
                </AlertDescription>
            </Alert>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {!showPin ? (
             <Button onClick={() => setShowPin(true)} disabled={!isValidForApproval}>
                Request Approval
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isValidForConfirmation}>
                Confirm Refund
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
