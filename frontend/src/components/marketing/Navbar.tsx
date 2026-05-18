"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigation } from "@/lib/admin/use-site-content";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const { items: navItems, loading: navLoading } = useNavigation("header");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = navLoading ? marketingConfig.mainNav : navItems.length > 0 ? navItems : marketingConfig.mainNav;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-background/80 backdrop-blur-md border-b border-border shadow-lg"
          : "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-sm">EF</span>
              </div>
              <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-lg group-hover:bg-blue-500/30 transition-colors" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              eBay<span className="text-blue-500">Flow</span>
              <span className="ml-1 text-xs font-medium text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center bg-muted/50 border border-border px-2 py-1.5 rounded-2xl backdrop-blur-sm">
            {links.map((link: any) => (
              <Link
                key={link.title || link.label}
                href={link.href || link.url}
                className={cn(
                  "relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-xl",
                  pathname === (link.href || link.url)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onMouseEnter={() => setHoveredLink(link.title || link.label)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link.title || link.label}
                {hoveredLink === (link.title || link.label) && (
                  <motion.div
                    layoutId="nav-hover"
                    className="absolute inset-0 bg-muted rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {pathname === (link.href || link.url) && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons + Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle size="sm" />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-xl border-border bg-muted/50 text-foreground hover:bg-muted backdrop-blur-sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-2">
                    Sign in
                  </span>
                </Link>
                <Link href="/register">
                  <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-background/95 backdrop-blur-2xl border border-border rounded-3xl p-6 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              {links.map((link: any) => (
                <Link
                  key={link.title || link.label}
                  href={link.href || link.url}
                  className={cn(
                    "px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                    pathname === (link.href || link.url)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.title || link.label}
                </Link>
              ))}
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle size="sm" />
                </div>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl border-border bg-muted/50 text-foreground py-6">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-6 shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
