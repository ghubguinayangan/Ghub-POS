"use client";

import { memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  ShoppingBag,
  Receipt,
  Settings,
  LogOut,
  AreaChart,
  BookUser,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/context/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const menuItems = [
  { href: "/dashboard", icon: AreaChart, label: "Dashboard", adminOnly: true },
  { href: "/dashboard/sales", icon: Receipt, label: "Sales History", adminOnly: true },
  { href: "/dashboard/products", icon: LayoutGrid, label: "Inventory", adminOnly: true },
  { href: "/dashboard/expenses", icon: Wallet, label: "Expenses", adminOnly: true },
];

const utangMenuItem = { href: "/dashboard/utang", icon: BookUser, label: "Utang", adminOnly: true };
const settingsMenuItem = { href: "/dashboard/settings", icon: Settings, label: "Settings", adminOnly: true };

const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
}

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { setOpenMobile } = useSidebar();
  const isAdmin = user?.role === 'Administrator';

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
    setOpenMobile(false);
  }
  
  const handleLogout = () => {
    logout();
    setOpenMobile(false);
  }

  return (
    <Sidebar className="border-r bg-sidebar text-sidebar-foreground" side="left" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-2 flex justify-center">
        <Link href="/dashboard" onClick={handleLinkClick}>
          <div className="flex items-center gap-2 p-2 font-bold text-lg text-sidebar-accent-foreground">
             <ShoppingBag className="h-8 w-8 shrink-0" />
             <span className="group-data-[collapsible=icon]:hidden">G-hub POS</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            (!item.adminOnly || isAdmin) && (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href} onClick={handleLinkClick}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          ))}
          {settings.enableUtangManagement && isAdmin && (
             <SidebarMenuItem key={utangMenuItem.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === utangMenuItem.href}
                  tooltip={utangMenuItem.label}
                >
                  <Link href={utangMenuItem.href} onClick={handleLinkClick}>
                    <utangMenuItem.icon />
                    <span>{utangMenuItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-2 border-t border-sidebar-border flex flex-col gap-2">
        <SidebarMenu>
            {isAdmin && (
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === settingsMenuItem.href}
                        tooltip={settingsMenuItem.label}
                        >
                        <Link href={settingsMenuItem.href} onClick={handleLinkClick}>
                            <settingsMenuItem.icon />
                            <span>{settingsMenuItem.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>

        {user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-start gap-3 p-2 h-auto w-full rounded-lg hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto">
                         <Avatar className="h-9 w-9 border border-sidebar-border">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                            <span className="font-semibold text-sm truncate text-sidebar-accent-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.role}</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="end" side="top" forceMount>
                     <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleProfileClick}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
});
AppSidebar.displayName = "AppSidebar";
