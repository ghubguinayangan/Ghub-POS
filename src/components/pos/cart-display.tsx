
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/app/(main)/pos/page";
import { formatToPHP } from "@/lib/currency";
import { PaymentDialog } from "./payment-dialog";
import type { Sale } from '@/lib/placeholder-data';
import { useSettings } from '@/context/settings-context';
import { UtangDialog, UtangFormValues } from './utang-dialog';

interface CartDisplayProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (totalAmount: number, paymentMethod: Sale['paymentMethod'], cashReceived?: number) => void;
  onProcessAsUtang: (debtorInfo: UtangFormValues) => void;
}

export default function CartDisplay({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  onProcessAsUtang,
}: CartDisplayProps) {
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isUtangDialogOpen, setUtangDialogOpen] = useState(false);
  const { settings } = useSettings();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handlePaymentSuccess = (paymentMethod: Sale['paymentMethod'], cashReceived?: number) => {
    onCheckout(total, paymentMethod, cashReceived);
    setPaymentDialogOpen(false);
  };
  
  const handleUtangConfirm = (values: UtangFormValues) => {
    onProcessAsUtang(values);
    setUtangDialogOpen(false);
  }

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Current Order</CardTitle>
          {cart.length > 0 && (
             <Button variant="ghost" size="icon" onClick={onClearCart} aria-label="Clear cart">
                <X className="h-4 w-4" />
             </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-6 pt-0">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={item.imageHint}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatToPHP(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                           <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                           </Button>
                           <Input
                             type="number"
                             value={item.quantity}
                             onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                             className="h-6 w-12 text-center"
                           />
                           <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <p className="font-semibold text-right whitespace-nowrap">{formatToPHP(item.price * item.quantity)}</p>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onRemoveFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        {cart.length > 0 && (
          <CardFooter className="flex-col !p-6">
            <div className="flex w-full items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatToPHP(total)}</span>
            </div>
             <div className="mt-4 w-full grid gap-2">
                <Button className="w-full" size="lg" onClick={() => setPaymentDialogOpen(true)}>
                    Proceed to Payment
                </Button>
                {settings.enableUtangManagement && (
                    <Button className="w-full" size="lg" variant="secondary" onClick={() => setUtangDialogOpen(true)}>
                    Process as Utang
                    </Button>
                )}
            </div>
          </CardFooter>
        )}
      </Card>
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        totalAmount={total}
        onPaymentSuccess={handlePaymentSuccess}
      />
       <UtangDialog 
        isOpen={isUtangDialogOpen}
        onOpenChange={setUtangDialogOpen}
        totalAmount={total}
        onConfirm={handleUtangConfirm}
      />
    </>
  );
}
