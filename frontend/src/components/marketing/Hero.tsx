"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap, CheckCircle2, Star, Users, Globe } from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { useSiteContent, useTrustSignals } from "@/lib/admin/use-site-content";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  },
};

const floatingVariants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function Hero() {
  const { content, loading } = useSiteContent("home");
  const { items: trustSignals, loading: trustLoading } = useTrustSignals();
  const heroData = content?.sections?.find((s: any) => s.sectionKey === "hero")?.content || marketingConfig.hero;
  const displayTrustSignals = trustLoading ? marketingConfig.trustSignals : (trustSignals.length > 0 ? trustSignals : marketingConfig.trustSignals);

  const hero = loading ? marketingConfig.hero : heroData;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_50%_-20%,#1e3a8a,transparent_70%)] dark:opacity-40 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_70%)] opacity-20" />
      <div className="absolute inset-0 dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="container relative z-10 px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                {hero.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]"
            >
              {hero.title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 animate-gradient">
                {hero.titleAccent}
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl"
            >
              {hero.description}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-5 mb-12"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-2xl px-10 h-14 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all duration-300 text-lg font-bold group"
                >
                  {hero.cta}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/features" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl px-10 h-14 border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-md text-lg font-medium"
                >
                  {hero.secondaryCta}
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8 pt-8 border-t border-border">
              {displayTrustSignals.map((signal: any, i: number) => {
                const Icon = signal.icon === "CheckCircle2" ? CheckCircle2 : signal.icon === "Shield" ? Shield : Star;
                return (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className={cn("h-5 w-5", signal.color, signal.icon === "Star" && "fill-yellow-500")} />
                    <span className="text-sm font-medium">{signal.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Visual - Interactive Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative perspective-1000 hidden lg:block"
          >
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="relative z-10 rounded-[32px] p-2 bg-gradient-to-br from-primary/10 to-primary/5 border border-border backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              {/* Dashboard Content Mockup */}
              <div className="bg-card rounded-[24px] overflow-hidden">
                <div className="h-12 bg-muted/50 border-b border-border flex items-center px-6 justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">EBAYFLOW_PRO_V4.0</div>
                </div>
                <div className="p-8 space-y-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-5 rounded-2xl border border-border">
                      <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">Global Revenue</div>
                      <div className="text-2xl font-bold text-foreground">{hero.preview?.revenue || "$42,850.00"}</div>
                      <div className="text-emerald-400 text-[10px] mt-1 font-medium">{hero.preview?.revenueGrowth || "+12.5% vs last month"}</div>
                    </div>
                    <div className="bg-muted/50 p-5 rounded-2xl border border-border">
                      <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">AI Listings</div>
                      <div className="text-2xl font-bold text-foreground">{hero.preview?.listings || "1,248"}</div>
                      <div className="text-blue-400 text-[10px] mt-1 font-medium">{hero.preview?.listingStatus || "98% SEO Optimized"}</div>
                    </div>
                  </div>
                  {/* Chart Mockup */}
                  <div className="bg-muted/50 p-6 rounded-2xl border border-border h-48 relative overflow-hidden">
                    <div className="flex justify-between items-end h-full gap-2">
                      {[40, 70, 45, 90, 65, 80, 50, 100, 85].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + (i * 0.1), duration: 0.8 }}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
            
            {/* Stats Overlay Cards */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              style={{ animationDelay: "1s" }}
              className="absolute -right-8 top-1/4 bg-card/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">ROI Increase</div>
                  <div className="text-lg font-bold text-foreground">{hero.preview?.roi || "3.4x"}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={floatingVariants}
              animate="animate"
              style={{ animationDelay: "2.5s" }}
              className="absolute -left-8 bottom-1/4 bg-card/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Sync Speed</div>
                  <div className="text-lg font-bold text-foreground">{hero.preview?.syncSpeed || "250ms"}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Hero Stats Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {(hero.stats || marketingConfig.hero.stats).map((stat: any, i: number) => (
            <div key={i} className="relative group">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
              <div className="absolute -left-4 top-0 bottom-0 w-px bg-border group-hover:bg-primary/30 transition-colors" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
