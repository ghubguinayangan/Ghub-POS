
"use client";

import { useRouter } from "next/navigation";
import useMockAuth from "@/hooks/use-mock-auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/main/app-sidebar";
import { AppHeader } from "@/components/main/app-header";
import { SettingsProvider } from "@/context/settings-context";
import { ProductProvider } from "@/context/product-context";
import { SalesProvider } from "@/context/sales-context";
import { UtangProvider } from "@/context/utang-context";
import { ExpenseProvider } from "@/context/expense-context";
import { useEffect } from "react";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);


  if (status === "loading") {
    return (
       <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Prevent flashing of main layout while redirecting
  }

  return (
    <SettingsProvider>
      <ProductProvider>
        <SalesProvider>
          <UtangProvider>
            <ExpenseProvider>
              <SidebarProvider>
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <AppHeader />
                  <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
                    {children}
                  </main>
                </div>
              </SidebarProvider>
            </ExpenseProvider>
          </UtangProvider>
        </SalesProvider>
      </ProductProvider>
    </SettingsProvider>
  );
}
