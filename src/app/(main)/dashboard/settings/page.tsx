

"use client"
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Palette, Printer, Store, Smartphone, Landmark, Settings as SettingsIcon, Trash2, BookUser, BookCopy, Sun, Moon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export default function SettingsPage() {
    const { toast } = useToast();
    const { settings, setSettings, isLoading } = useSettings();

    const [theme, setThemeState] = useState<"light" | "dark">("light");

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains("dark")
        setThemeState(isDarkMode ? "dark" : "light")
    }, [])

    const setTheme = (theme: "light" | "dark") => {
        setThemeState(theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof settings) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ [field]: reader.result as string });
                toast({ title: "Image uploaded successfully." });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTestPrinter = () => {
        // Create a test receipt
        const testReceiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test Receipt</title>
                <style>
                    @media print {
                        @page { size: 80mm auto; margin: 0; }
                        body { margin: 0; padding: 0; }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 80mm;
                        margin: 0 auto;
                        padding: 10mm;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .large { font-size: 16px; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                </style>
            </head>
            <body>
                <div class="center">
                    <div class="bold large">${settings.storeName || 'EYIR POS'}</div>
                    <div>TEST RECEIPT</div>
                </div>
                <div class="divider"></div>
                <div class="center">
                    <p>This is a test receipt to verify your printer is working correctly.</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                </div>
                <div class="divider"></div>
                <div class="center">
                    <p class="bold">✓ Printer is working!</p>
                    <p>Powered by EYIR POS</p>
                </div>
            </body>
            </html>
        `;
        
        // Create iframe and print
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(testReceiptHTML);
            iframeDoc.close();
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.print();
                    setTimeout(() => document.body.removeChild(iframe), 100);
                }, 250);
            };
        }
        
        toast({
            title: "Testing Printer",
            description: "A test receipt has been sent to the printer.",
        })
    }
    
    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/4" />
                {[...Array(6)].map((_, i) => (
                     <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }
    
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Palette className="h-6 w-6" />
                <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
                Customize the look and feel of your POS.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent/50">
                        <div>
                            <Label className="cursor-pointer">Theme Mode</Label>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark mode.</p>
                        </div>
                        <div className="relative h-[1.2rem] w-[1.2rem]">
                            <Sun className="h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute inset-0 h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                        Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                        Dark
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ primaryColor: e.target.value })}
                        className="h-10 w-12 cursor-pointer p-1"
                    />
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">#</span>
                        <Input
                            value={settings.primaryColor.substring(1)}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^[0-9a-f]{0,6}$/i.test(value)) {
                                    setSettings({ primaryColor: `#${value}`});
                                }
                            }}
                            className="pl-7"
                            maxLength={6}
                        />
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground">Color changes are applied globally in real-time.</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <BookUser className="h-6 w-6" />
                <CardTitle>Feature Management</CardTitle>
            </div>
            <CardDescription>
                Enable or disable optional features for your POS.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Utang Management</Label>
                    <p className="text-sm text-muted-foreground">Enable debt tracking and management features.</p>
                </div>
                <Switch checked={settings.enableUtangManagement} onCheckedChange={(checked) => setSettings({ enableUtangManagement: checked })} />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <BookCopy className="h-6 w-6" />
                <CardTitle>Inventory Settings</CardTitle>
            </div>
            <CardDescription>
                Configure inventory and stock management features.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Enable Stock Tracking</Label>
                    <p className="text-sm text-muted-foreground">Globally enable or disable inventory tracking.</p>
                </div>
                <Switch checked={settings.enableStockTracking} onCheckedChange={(checked) => setSettings({ enableStockTracking: checked })} />
            </div>
            <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="low-stock-threshold" className={!settings.enableStockTracking ? 'text-muted-foreground' : ''}>Low Stock Threshold</Label>
                <p className="text-sm text-muted-foreground">Set the level at which products are considered "low stock".</p>
                <Input
                    id="low-stock-threshold"
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => setSettings({ lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
                    className="mt-2 w-24"
                    disabled={!settings.enableStockTracking}
                />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <SettingsIcon className="h-6 w-6" />
                <CardTitle>POS Interface Customization</CardTitle>
            </div>
            <CardDescription>
                Configure the Point of Sale interface.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label className={!settings.enableStockTracking ? 'text-muted-foreground' : ''}>Show Stock on Product Cards</Label>
                    <p className="text-sm text-muted-foreground">Display current stock levels on the POS product grid.</p>
                </div>
                <Switch checked={settings.showStockOnPOS} onCheckedChange={(checked) => setSettings({ showStockOnPOS: checked })} disabled={!settings.enableStockTracking} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Show Product Price on POS</Label>
                    <p className="text-sm text-muted-foreground">Display prices on the product grid.</p>
                </div>
                <Switch checked={settings.showPriceOnPOS} onCheckedChange={(checked) => setSettings({ showPriceOnPOS: checked })} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Show Product Image on POS</Label>
                    <p className="text-sm text-muted-foreground">Display images on the product grid.</p>
                </div>
                <Switch checked={settings.showImageOnPOS} onCheckedChange={(checked) => setSettings({ showImageOnPOS: checked })} />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Printer className="h-6 w-6" />
                <CardTitle>Hardware</CardTitle>
            </div>
          <CardDescription>
            Configure receipt printers and cash drawers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label>Auto-Print Receipts</Label>
                    <p className="text-sm text-muted-foreground">Automatically print receipt after successful payment. Works with any printer (thermal, regular, or PDF).</p>
                </div>
                <Switch 
                    checked={settings.autoPrintReceipt} 
                    onCheckedChange={(checked) => setSettings({ autoPrintReceipt: checked })} 
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label>Auto-Open Cash Drawer</Label>
                    <p className="text-sm text-muted-foreground">Automatically trigger cash drawer after cash payment. Requires ESC/POS compatible printer with drawer port.</p>
                </div>
                <Switch 
                    checked={settings.autoOpenDrawer} 
                    onCheckedChange={(checked) => setSettings({ autoOpenDrawer: checked })} 
                />
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Printer Compatibility</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Thermal Receipt Printers:</strong> 58mm, 80mm ESC/POS compatible printers (Epson, Star, Bixolon, etc.)</li>
                    <li><strong>Connection Types:</strong> USB, Bluetooth, WiFi/Network - all supported via browser print dialog</li>
                    <li><strong>Cash Drawer:</strong> Works with standard RJ11/RJ12 cash drawers connected to printer</li>
                    <li><strong>Regular Printers:</strong> Any inkjet/laser printer can also print receipts</li>
                    <li><strong>PDF Export:</strong> Save receipts as PDF if no printer is available</li>
                </ul>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTestPrinter}>Test Printer</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6" />
                <CardTitle>Digital Payments</CardTitle>
            </div>
            <CardDescription>
                Manage your digital payment options.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
             <div className="space-y-4 rounded-lg border p-4">
                <Label className="font-semibold">GCash</Label>
                <div className="space-y-2">
                    <Label htmlFor="gcash-name">GCash Account Name</Label>
                    <Input id="gcash-name" placeholder="e.g., Juan dela Cruz" value={settings.gcashName} onChange={(e) => setSettings({ gcashName: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gcash-number">GCash Number</Label>
                    <Input id="gcash-number" placeholder="e.g., 09123456789" value={settings.gcashNumber} onChange={(e) => setSettings({ gcashNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gcash-qr-code">Upload GCash QR Code</Label>
                    <Input id="gcash-qr-code" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'gcashQRCode')} />
                    {settings.gcashQRCode && (
                        <div className="relative mt-2 w-32 h-32">
                            <Image src={settings.gcashQRCode} alt="GCash QR Preview" fill className="object-contain rounded-md border p-1" />
                            <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setSettings({ gcashQRCode: null })}>
                                <Trash2 className="h-3 w-3"/>
                            </Button>
                        </div>
                    )}
                </div>
             </div>
             <div className="space-y-4 rounded-lg border p-4">
                <Label className="font-semibold">PayMaya</Label>
                 <div className="space-y-2">
                    <Label htmlFor="paymaya-name">PayMaya Account Name</Label>
                    <Input id="paymaya-name" placeholder="e.g., Juan dela Cruz" value={settings.paymayaName} onChange={(e) => setSettings({ paymayaName: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paymaya-number">PayMaya Number</Label>
                    <Input id="paymaya-number" placeholder="e.g., 09123456789" value={settings.paymayaNumber} onChange={(e) => setSettings({ paymayaNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paymaya-qr-code">Upload PayMaya QR Code</Label>
                    <Input id="paymaya-qr-code" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'paymayaQRCode')} />
                    {settings.paymayaQRCode && (
                         <div className="relative mt-2 w-32 h-32">
                            <Image src={settings.paymayaQRCode} alt="PayMaya QR Preview" fill className="object-contain rounded-md border p-1" />
                             <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setSettings({ paymayaQRCode: null })}>
                                <Trash2 className="h-3 w-3"/>
                            </Button>
                        </div>
                    )}
                </div>
             </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Landmark className="h-6 w-6" />
                <CardTitle>Bank Account Details</CardTitle>
            </div>
            <CardDescription>
                Add your bank account for reference.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input id="bank-name" placeholder="e.g., BDO Unibank" value={settings.bankName} onChange={(e) => setSettings({ bankName: e.target.value })}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input id="account-name" placeholder="e.g., Juan dela Cruz" value={settings.accountName} onChange={(e) => setSettings({ accountName: e.target.value })}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input id="account-number" placeholder="e.g., 001234567890" value={settings.accountNumber} onChange={(e) => setSettings({ accountNumber: e.target.value })}/>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Store className="h-6 w-6" />
                <CardTitle>Store & Receipt Information</CardTitle>
            </div>
            <CardDescription>
                Manage your store's branding and details for receipts.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input id="store-name" value={settings.storeName} onChange={(e) => setSettings({ storeName: e.target.value })} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="store-address">Address</Label>
                <Input id="store-address" placeholder="123 Main St, City, Country" value={settings.storeAddress} onChange={(e) => setSettings({ storeAddress: e.target.value })} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="store-phone">Phone Number</Label>
                <Input id="store-phone" placeholder="+63 912 345 6789" value={settings.storePhone} onChange={(e) => setSettings({ storePhone: e.target.value })}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="store-tin">TIN</Label>
                <Input id="store-tin" placeholder="000-000-000-000" value={settings.storeTIN} onChange={(e) => setSettings({ storeTIN: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="store-logo">Store Logo</Label>
                <Input id="store-logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'storeLogo')} />
                {settings.storeLogo && (
                    <div className="relative mt-2 w-32 h-32">
                        <Image src={settings.storeLogo} alt="Store Logo Preview" fill className="object-contain rounded-md border p-1" />
                        <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setSettings({ storeLogo: null })}>
                            <Trash2 className="h-3 w-3"/>
                        </Button>
                    </div>
                )}
                <p className="text-sm text-muted-foreground">Recommended size: 256x256px. Appears on the receipt.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="receipt-footer">Receipt Footer Message</Label>
                <Textarea id="receipt-footer" placeholder="Thank you for shopping! Please come again." value={settings.receiptFooter} onChange={(e) => setSettings({ receiptFooter: e.target.value })}/>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
