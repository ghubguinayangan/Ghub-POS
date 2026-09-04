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
import { useState } from "react";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
    <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2 lg:hidden">
            <Logo className="mx-auto" />
        </div>
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="text-muted-foreground">
                Enter your email to login to your account.
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@eyir.com" {...field} />
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </Form>

        <Dialog open={showForgot} onOpenChange={setShowForgot}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
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
                        <FormControl><Input placeholder="admin@eyir.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {forgotStep === "question" && (
                  <>
                    <div className="rounded-lg border bg-muted p-3 text-sm">
                      <span className="font-medium">Question: </span>{securityQuestion}
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
                          <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
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
    </div>
  );
}
