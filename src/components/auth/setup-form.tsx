"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/logo";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function SetupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { setupAdmin, hasAdminAccount, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // /setup only ever creates the FIRST account. Once any account exists,
  // this page must not be usable again — otherwise visiting it directly
  // (bookmark, typed URL, old tab) lets anyone mint a brand-new admin
  // account on top of whatever already exists, bypassing the Users page's
  // account limit entirely.
  useEffect(() => {
    if (!authLoading && hasAdminAccount) {
      router.replace("/login");
    }
  }, [authLoading, hasAdminAccount, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await setupAdmin(values.name, values.email, values.password);
    if (result.success) {
      toast({
        title: "Setup Complete",
        description: "Administrator account created successfully.",
      });
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: result.message || "Could not create administrator account.",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2 lg:hidden">
            <Logo className="mx-auto" />
        </div>
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome to G-hub POS</h1>
            <p className="text-muted-foreground">
                Let's set up your administrator account to get started.
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@yourstore.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
    </div>
  );
}
