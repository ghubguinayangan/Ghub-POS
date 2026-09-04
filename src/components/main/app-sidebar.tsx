"use client";

import { memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    router.push('/dashboard/settings');
    setOpenMobile(false);
  }

  const handleLogout = () => {
    logout();
    setOpenMobile(false);
  }

  return (
    <Sidebar className="border-r border-sidebar-border" side="left" collapsible="icon">
      <SidebarHeader className="p-3">
        <Link href="/dashboard" onClick={handleLinkClick}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
            <div className="relative flex-shrink-0">
              <Image
                src="/ghublogo.jpg"
                alt="G-hub POS"
                width={36}
                height={36}
                className="rounded-lg object-cover"
                priority
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <span className="font-bold text-base text-sidebar-foreground tracking-tight block leading-tight">
                G-hub <span className="text-white/60">POS</span>
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">
                Point of Sale
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-2 py-2">
        <div className="group-data-[collapsible=icon]:hidden px-2 py-1.5">
          <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
            Menu
          </span>
        </div>
        <SidebarMenu>
          {menuItems.map((item) => (
            (!item.adminOnly || isAdmin) && (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="h-10 rounded-lg transition-all duration-200"
                >
                  <Link href={item.href} onClick={handleLinkClick}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
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
                  className="h-10 rounded-lg transition-all duration-200"
                >
                  <Link href={utangMenuItem.href} onClick={handleLinkClick}>
                    <utangMenuItem.icon className="h-4 w-4" />
                    <span className="font-medium">{utangMenuItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
            {isAdmin && (
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === settingsMenuItem.href}
                        tooltip={settingsMenuItem.label}
                        className="h-10 rounded-lg transition-all duration-200"
                        >
                        <Link href={settingsMenuItem.href} onClick={handleLinkClick}>
                            <settingsMenuItem.icon className="h-4 w-4" />
                            <span className="font-medium">{settingsMenuItem.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>

        {user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-start gap-3 p-2.5 h-auto w-full rounded-xl hover:bg-white/10 mt-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto transition-colors">
                         <Avatar className="h-9 w-9 border-2 border-white/20">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                            <span className="font-semibold text-sm text-sidebar-foreground truncate">{user.name}</span>
                            <span className="text-xs text-sidebar-foreground/50 truncate">{user.role}</span>
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
                        <span>Settings</span>
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
