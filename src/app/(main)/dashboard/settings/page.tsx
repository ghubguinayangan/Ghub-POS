

"use client"
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Palette, Trash2, BookUser, BookCopy, AlertTriangle, Loader2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';


export default function SettingsPage() {
    const { toast } = useToast();
    const { settings, setSettings, isLoading } = useSettings();

    const [isClearing, setIsClearing] = useState(false);

    const handleClearData = async () => {
        setIsClearing(true);
        try {
            const tables = [
                'ghub_daily_summary',
                'ghub_sales',
                'ghub_expenses',
                'ghub_inventory_levels',
                'ghub_utang',
                'ghub_utang_transactions',
                'ghub_shifts',
                'ghub_activity_logs',
                'ghub_categories',
                'ghub_settings',
            ];

            // Every ghub_* table uses a BIGINT identity column, not a UUID -
            // matching "every row" needs a filter valid for that type. IDs
            // are always >= 1, so gte 0 covers all of them.
            const results = await Promise.all(
                tables.map((table) => supabase.from(table).delete().gte('id', 0))
            );

            const errors = results.filter((r) => r.error);
            if (errors.length > 0) {
                console.error('Clear data errors:', errors);
                toast({
                    variant: 'destructive',
                    title: 'Clear Data Failed',
                    description: `Failed to clear ${errors.length} table(s). Check console for details.`,
                });
            } else {
                toast({
                    title: 'Data Cleared',
                    description: 'All synced data has been deleted from Supabase.',
                });
            }
        } catch (err) {
            console.error('Clear data error:', err);
            toast({
                variant: 'destructive',
                title: 'Clear Data Failed',
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsClearing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/4" />
                {[...Array(4)].map((_, i) => (
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
      <p className="text-muted-foreground -mt-6">
        This dashboard only displays data synced from your G-hub POS mobile app - it doesn&apos;t control the
        app itself. These settings only affect how this website behaves.
      </p>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Palette className="h-6 w-6" />
                <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
                Customize the look and feel of this dashboard.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                Show or hide optional sections of this dashboard.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Utang Management</Label>
                    <p className="text-sm text-muted-foreground">Show the Utang (debt tracking) page in the sidebar.</p>
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
                Configure how this dashboard flags low stock and tracks inventory.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Enable Stock Tracking</Label>
                    <p className="text-sm text-muted-foreground">Show the stock field when adding or editing products here.</p>
                </div>
                <Switch checked={settings.enableStockTracking} onCheckedChange={(checked) => setSettings({ enableStockTracking: checked })} />
            </div>
            <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="low-stock-threshold" className={!settings.enableStockTracking ? 'text-muted-foreground' : ''}>Low Stock Threshold</Label>
                <p className="text-sm text-muted-foreground">Products at or below this stock level are flagged as &quot;low stock&quot; on the dashboard.</p>
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

      <Card className="border-destructive">
        <CardHeader>
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
                Irreversible actions. These will permanently delete data from Supabase.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
                <div>
                    <Label className="font-medium">Clear All Synced Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Delete all sales, expenses, inventory, utang, and summary data from Supabase. This cannot be undone.
                    </p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isClearing}>
                            {isClearing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Clear Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete ALL synced data from Supabase including sales, expenses, inventory levels, daily summaries, utang records, and settings. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleClearData}
                            >
                                Yes, Delete Everything
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
