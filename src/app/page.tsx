"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { status, hasAdminAccount, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!hasAdminAccount) {
        router.replace("/setup");
      } else if (status === "unauthenticated") {
        router.replace("/login");
      } else if (status === "authenticated") {
        router.replace("/dashboard");
      }
    }
  }, [status, hasAdminAccount, isLoading, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
      <div className="w-1/3 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
