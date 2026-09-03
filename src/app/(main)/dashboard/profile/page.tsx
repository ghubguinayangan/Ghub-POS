
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, Profile } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


export default function ProfilePage() {
    const { user, isLoading, updateCurrentUser, resetCurrentUserPassword } = useAuth();
    const { toast } = useToast();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
        }
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name,
                email: user.email,
            });
            setAvatarPreview(user.avatarUrl);
        }
    }, [user, profileForm]);
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2);
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
        const updates: Partial<Pick<Profile, 'name' | 'avatarUrl'>> = { name: data.name };
        if (avatarPreview && avatarPreview !== user?.avatarUrl) {
            updates.avatarUrl = avatarPreview;
        }

        const result = await updateCurrentUser(updates);
        if (result.success) {
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.message });
        }
    };

    const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
        const result = await updateCurrentUser({ password: data.newPassword }, data.currentPassword);
        if (result.success) {
             toast({ title: "Password Updated", description: "Your password has been successfully changed." });
             passwordForm.reset();
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.message });
        }
    };

    const handleResetPassword = async () => {
        // Manually validate only the fields needed for reset
        const validationResult = await passwordForm.trigger(['newPassword', 'confirmPassword']);
        if (!validationResult) {
            return;
        }

        const { newPassword } = passwordForm.getValues();
        const result = await resetCurrentUserPassword(newPassword);

        if (result.success) {
            toast({ title: "Password Reset", description: "Your password has been successfully reset." });
            passwordForm.reset();
        } else {
            toast({ variant: "destructive", title: "Reset Failed", description: result.message });
        }
    };
    
    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <Skeleton className="h-24 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details and profile picture here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                             <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={avatarPreview || ''} alt={user.name} />
                                        <AvatarFallback className="text-3xl">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80">
                                        <Camera className="h-4 w-4" />
                                        <span className="sr-only">Change profile picture</span>
                                    </Label>
                                    <Input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                            </div>
                            <FormField control={profileForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input {...field} readOnly disabled /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your login password.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex items-center gap-2">
                                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                    {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                                {user.role === 'Administrator' && (
                                    <Button type="button" variant="secondary" onClick={handleResetPassword} disabled={passwordForm.formState.isSubmitting}>
                                        Reset (Admin)
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
