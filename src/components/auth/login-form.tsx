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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Loader2, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Logo from "@/components/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const forgotSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  answer: z.string().min(1, { message: "Answer is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "question" | "done">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "", answer: "", newPassword: "" },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const success = await login(values.email, values.password);
    if (success) {
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password. Please try again." });
      form.reset();
    }
    setIsLoading(false);
  }

  async function handleForgotSubmit(data: z.infer<typeof forgotSchema>) {
    if (forgotStep === "email") {
      if (!data.email) {
        toast({ variant: "destructive", title: "Error", description: "Please enter your email." });
        return;
      }
      setForgotLoading(true);
      const { data: question, error } = await supabase.rpc('get_security_question', { email_text: data.email });
      setForgotLoading(false);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to look up security question." });
        return;
      }
      if (!question) {
        toast({ variant: "destructive", title: "Not Found", description: "No account found with this email, or no security question is set up." });
        return;
      }
      setForgotEmail(data.email);
      setSecurityQuestion(question);
      setForgotStep("question");
    } else if (forgotStep === "question") {
      if (!data.answer || !data.newPassword) {
        toast({ variant: "destructive", title: "Error", description: "Please fill in all fields." });
        return;
      }
      setForgotLoading(true);
      const { data: success, error } = await supabase.rpc('reset_password_with_security', {
        email_text: forgotEmail,
        answer_text: data.answer,
        new_password: data.newPassword,
      });
      setForgotLoading(false);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
        return;
      }
      if (!success) {
        toast({ variant: "destructive", title: "Wrong Answer", description: "The answer is incorrect. Please try again." });
        return;
      }
      setForgotStep("done");
      toast({ title: "Password Reset", description: "Your password has been changed. You can now log in." });
    }
  }

  return (
    <>
      <div className="text-center space-y-2 lg:hidden">
        <Logo className="mx-auto" />
      </div>

      <Card className="border-0 shadow-xl shadow-primary/5 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="space-y-1 text-center mb-8">
            <div className="hidden lg:flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="admin@eyir.com"
                          {...field}
                          className="pl-10 h-11 bg-background/50"
                        />
                      </div>
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
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          className="pl-10 pr-10 h-11 bg-background/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Forgot Password?
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        &copy; {new Date().getFullYear()} G-hub POS. All rights reserved.
      </p>

      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {forgotStep === "email" && "Enter your email address to begin password recovery."}
              {forgotStep === "question" && "Answer the security question to reset your password."}
              {forgotStep === "done" && "Your password has been changed. You can now log in with your new password."}
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotForm}>
            <form onSubmit={forgotForm.handleSubmit(handleForgotSubmit)} className="space-y-4">
              {forgotStep === "email" && (
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="admin@eyir.com" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {forgotStep === "question" && (
                <>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-medium text-primary mb-1">Security Question</p>
                    <p className="text-sm font-medium">{securityQuestion}</p>
                  </div>
                  <FormField
                    control={forgotForm.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Answer</FormLabel>
                        <FormControl><Input placeholder="Type your answer..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forgotForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter new password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {forgotStep === "done" && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Password successfully reset. You can now sign in with your new password.</p>
                </div>
              )}
              {forgotStep === "done" ? (
                <Button type="button" className="w-full" onClick={() => setShowForgot(false)}>
                  Back to Login
                </Button>
              ) : (
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {forgotStep === "email" && "Continue"}
                  {forgotStep === "question" && "Reset Password"}
                </Button>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
