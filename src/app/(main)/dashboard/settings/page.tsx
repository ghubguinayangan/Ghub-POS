

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
import { Trash2, BookCopy, AlertTriangle, Loader2, ShieldQuestion, UserCog, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';


export default function SettingsPage() {
    const { toast } = useToast();
    const { settings, setSettings, isLoading } = useSettings();
    const { user } = useAuth();

    const [isClearing, setIsClearing] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSavingAdmin, setIsSavingAdmin] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [adminNewPassword, setAdminNewPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            const loadSecurity = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('security_question, security_answer')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setSecurityQuestion(data.security_question || '');
                    setSecurityAnswer(data.security_answer || '');
                }
            };
            loadSecurity();
            setAdminName(user.name || '');
            setAdminEmail(user.email || '');
        }
    }, [user]);

    const { updateCurrentUser } = useAuth();

    const handleSaveAdmin = async () => {
        if (!adminName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name is required.' });
            return;
        }
        if (!adminPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'Current password is required to save changes.' });
            return;
        }
        if (adminNewPassword && adminNewPassword !== adminConfirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.' });
            return;
        }
        if (adminNewPassword && adminNewPassword.length < 8) {
            toast({ variant: 'destructive', title: 'Error', description: 'New password must be at least 8 characters.' });
            return;
        }
        setIsSavingAdmin(true);
        const updates: any = { name: adminName.trim(), email: adminEmail.trim() };
        if (adminNewPassword) {
            updates.password = adminNewPassword;
        }
        const result = await updateCurrentUser(updates, adminPassword);
        setIsSavingAdmin(false);
        if (result.success) {
            toast({ title: 'Account Updated', description: 'Your account details have been updated.' });
            setAdminPassword('');
            setAdminNewPassword('');
            setAdminConfirmPassword('');
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }
    };

    const handleSaveSecurity = async () => {
        if (!securityQuestion.trim() || !securityAnswer.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please enter both a security question and answer.',
            });
            return;
        }
        if (!user) return;
        setIsSavingSecurity(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                security_question: securityQuestion.trim(),
                security_answer: securityAnswer.trim().toLowerCase(),
            })
            .eq('id', user.id);
        setIsSavingSecurity(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } else {
            toast({ title: 'Security Question Saved', description: 'Your security question has been updated.' });
        }
    };

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
                <UserCog className="h-6 w-6" />
                <CardTitle>Admin Account</CardTitle>
            </div>
            <CardDescription>
                Update your admin name, email, and password used for login.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input
                    id="admin-name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin-email">Email (Login)</Label>
                <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin-password">Current Password</Label>
                <div className="relative">
                    <Input
                        id="admin-password"
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="Required to save changes"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin-new-password">New Password (optional)</Label>
                <div className="relative">
                    <Input
                        id="admin-new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirm New Password</Label>
                <div className="relative">
                    <Input
                        id="admin-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        className="pr-10"
                        disabled={!adminNewPassword}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={!adminNewPassword}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <Button onClick={handleSaveAdmin} disabled={isSavingAdmin}>
                {isSavingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Account Changes
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <ShieldQuestion className="h-6 w-6" />
                <CardTitle>Security Question</CardTitle>
            </div>
            <CardDescription>
                Set up a security question for password recovery. If you forget your password, you can reset it by answering this question on the login page.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="security-question">Security Question</Label>
                <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a security question" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</SelectItem>
                        <SelectItem value="What was the name of your first pet?">What was the name of your first pet?</SelectItem>
                        <SelectItem value="What city were you born in?">What city were you born in?</SelectItem>
                        <SelectItem value="What is the name of your favorite teacher?">What is the name of your favorite teacher?</SelectItem>
                        <SelectItem value="What was the make of your first car?">What was the make of your first car?</SelectItem>
                        <SelectItem value="What is your favorite food?">What is your favorite food?</SelectItem>
                        <SelectItem value="What street did you grow up on?">What street did you grow up on?</SelectItem>
                        <SelectItem value="What is your favorite movie?">What is your favorite movie?</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="security-answer">Answer</Label>
                <Input
                    id="security-answer"
                    placeholder="Your answer"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                />
            </div>
            <Button onClick={handleSaveSecurity} disabled={isSavingSecurity}>
                {isSavingSecurity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Security Question
            </Button>
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
