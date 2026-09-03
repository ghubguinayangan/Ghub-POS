"use client";

import Logo from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:flex lg:flex-col lg:justify-between p-8">
        <Logo />
        <div className="max-w-md">
            <h1 className="text-4xl font-bold tracking-tight">Making Every Sale Feel Easy</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                A simple, friendly POS system that helps G-Hub Store keep sales, inventory, and everyday tasks running smoothly.
            </p>
        </div>
        <footer className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} G-hub POS. All rights reserved.
        </footer>
      </div>
      <div className="flex min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
