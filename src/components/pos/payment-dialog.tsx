
import { useState, useEffect } from "react";
import Image from 'next/image';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatToPHP } from "@/lib/currency";
import { Banknote, Smartphone, Landmark, CreditCard } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Sale } from "@/lib/placeholder-data";

type PaymentMethod = Sale['paymentMethod'];

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  totalAmount: number;
  onPaymentSuccess: (paymentMethod: PaymentMethod, cashReceived?: number) => void;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  totalAmount,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState<number | string>("");
  const [change, setChange] = useState(0);
  const { settings } = useSettings();

  useEffect(() => {
    if (paymentMethod === "Cash") {
      const received = typeof cashReceived === 'number' ? cashReceived : parseFloat(cashReceived);
      if (!isNaN(received) && received >= totalAmount) {
        setChange(received - totalAmount);
      } else {
        setChange(0);
      }
    }
  }, [cashReceived, totalAmount, paymentMethod]);

  const handleConfirmPayment = () => {
    const cash = paymentMethod === 'Cash' && typeof cashReceived === 'number' 
      ? cashReceived 
      : (typeof cashReceived === 'string' ? parseFloat(cashReceived) : undefined);
    onPaymentSuccess(paymentMethod, cash);
  };
  
  const cashTenderPresets = [50, 100, 200, 500, 1000];

  useEffect(() => {
      if(isOpen) {
          setCashReceived("");
          setChange(0);
          setPaymentMethod("Cash");
      }
  }, [isOpen])

  const renderDigitalPayment = (type: 'gcash' | 'paymaya') => {
      const accountName = type === 'gcash' ? settings.gcashName : settings.paymayaName;
      const number = type === 'gcash' ? settings.gcashNumber : settings.paymayaNumber;
      const qrCode = type === 'gcash' ? settings.gcashQRCode : settings.paymayaQRCode;
      const name = type.charAt(0).toUpperCase() + type.slice(1);

      if (!accountName && !number && !qrCode) {
          return (
               <Alert variant="destructive">
                  <AlertTitle>{name} Not Configured</AlertTitle>
                  <AlertDescription>
                      Please set up your {name} details in the settings page.
                  </AlertDescription>
              </Alert>
          )
      }
      
      return (
        <div className="space-y-4 text-center">
            <p className="text-muted-foreground">Scan the {name} QR Code to pay, or send to the account below.</p>
            {qrCode && (
                <div className="flex justify-center">
                    <div className="relative w-48 h-48 p-2 bg-white rounded-md border">
                         <Image src={qrCode} alt={`${name} QR Code`} fill className="object-contain" />
                    </div>
                </div>
            )}
             {(accountName || number) && (
                <div className="text-center space-y-1 pt-2">
                    {accountName && <p className="font-semibold text-lg">{accountName}</p>}
                    {number && <p className="font-mono text-base">{number}</p>}
                </div>
            )}
        </div>
      )
  }
  
  const renderBankPayment = () => {
      const { bankName, accountName, accountNumber } = settings;
       if (!bankName && !accountName && !accountNumber) {
          return (
               <Alert variant="destructive">
                  <AlertTitle>Bank Details Not Configured</AlertTitle>
                  <AlertDescription>
                      Please set up your bank details in the settings page.
                  </AlertDescription>
              </Alert>
          )
      }

      return (
           <div className="space-y-4 text-center">
                <p className="text-muted-foreground">Transfer to the designated bank account.</p>
                <div className="p-4 bg-muted/50 rounded-md text-left space-y-1">
                    {bankName && <p><span className="font-semibold text-sm">Bank:</span> {bankName}</p>}
                    {accountName && <p><span className="font-semibold text-sm">Account Name:</span> {accountName}</p>}
                    {accountNumber && <p><span className="font-semibold text-sm">Account No:</span> {accountNumber}</p>}
                </div>
            </div>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Payment</DialogTitle>
          <DialogDescription>
            Total amount due:{" "}
            <span className="font-bold text-primary">{formatToPHP(totalAmount)}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="Cash"><Banknote className="mr-2 h-4 w-4" />Cash</TabsTrigger>
                <TabsTrigger value="GCash"><Smartphone className="mr-2 h-4 w-4" />GCash</TabsTrigger>
                <TabsTrigger value="PayMaya"><CreditCard className="mr-2 h-4 w-4"/>PayMaya</TabsTrigger>
                <TabsTrigger value="Bank"><Landmark className="mr-2 h-4 w-4"/>Bank</TabsTrigger>
            </TabsList>
            <TabsContent value="Cash" className="mt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="cashReceived">Cash Received</Label>
                    <Input
                        id="cashReceived"
                        type="number"
                        placeholder="0.00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="text-lg h-12"
                    />
                </div>
                 <div className="flex flex-wrap gap-2">
                    {cashTenderPresets.map(val => (
                        <Button key={val} variant="outline" onClick={() => setCashReceived(val)}>{formatToPHP(val)}</Button>
                    ))}
                    <Button variant="outline" onClick={() => setCashReceived(totalAmount)}>Exact</Button>
                </div>
                {change > 0 && (
                    <div className="text-lg font-semibold text-center rounded-md bg-accent/50 p-4">
                        Change: <span className="text-primary">{formatToPHP(change)}</span>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="GCash" className="mt-4">
                {renderDigitalPayment('gcash')}
            </TabsContent>
            <TabsContent value="PayMaya" className="mt-4">
                {renderDigitalPayment('paymaya')}
            </TabsContent>
             <TabsContent value="Bank" className="mt-4">
                {renderBankPayment()}
            </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleConfirmPayment}
            disabled={paymentMethod === 'Cash' && (Number(cashReceived) < totalAmount || cashReceived === "")}
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
