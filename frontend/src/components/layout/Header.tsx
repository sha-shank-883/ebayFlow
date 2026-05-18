"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand transition-colors" />
            <Input
              className="pl-10 rounded-xl bg-muted/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 text-foreground placeholder:text-muted-foreground transition-all h-10"
              placeholder="Search listings, orders, inventory..."
              type="search"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border/50">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-medium text-slate-200">eBay UK Account</span>
            <span className="text-xs text-profit flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-profit"></span>
              </span>
              Connected (Sandbox)
            </span>
          </div>

          <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full ring-2 ring-background" />
          </Button>

          <ThemeToggle size="sm" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-muted">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border text-card-foreground shadow-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer">
                <Link href="/settings">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer">
                <Link href="/billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
