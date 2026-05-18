"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Shield, Crown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { usePricing } from "@/lib/admin/use-site-content";

export function PricingCards() {
  const [isYearly, setIsYearly] = useState(true);
  const { plans: apiPlans, loading } = usePricing(isYearly ? "yearly" : "monthly");

  const plans = loading 
    ? (isYearly ? marketingConfig.pricing.yearly : marketingConfig.pricing.monthly)
    : (apiPlans.length > 0 ? apiPlans : (isYearly ? marketingConfig.pricing.yearly : marketingConfig.pricing.monthly));

  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Invest in Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                eBay Empire
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Transparent pricing tailored for UK sellers of all sizes. 
              No hidden fees, no credit card required to start.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={cn("text-sm transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 rounded-full bg-muted border border-border p-1 transition-colors hover:border-primary/50"
              >
                <motion.div
                  animate={{ x: isYearly ? 28 : 0 }}
                  className="w-5 h-5 rounded-full bg-primary shadow-lg shadow-primary/50"
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>Yearly</span>
                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Save 20%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const isEnterprise = plan.name === "Enterprise";
            const isPopular = plan.isPopular;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col",
                  isPopular 
                    ? "bg-gradient-to-b from-blue-600/20 to-blue-900/10 border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-20" 
                    : "bg-card/50 border-border hover:border-border/70"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-xl">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    {plan.name === "Starter" && <Zap className="h-5 w-5 text-primary" />}
                    {plan.name === "Professional" && <Crown className="h-5 w-5 text-primary" />}
                    {plan.name === "Enterprise" && <Shield className="h-5 w-5 text-primary" />}
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-foreground tracking-tight">{plan.price}</span>
                    {!isEnterprise && (
                      <span className="text-muted-foreground font-medium">/mo</span>
                    )}
                  </div>
                  {isYearly && !isEnterprise && (
                    <p className="text-xs text-primary font-medium mt-2">Billed annually</p>
                  )}
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">What's included:</p>
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 group/item">
                      <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover/item:bg-primary/20">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/80 transition-colors group-hover/item:text-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link href={isEnterprise ? "/contact" : "/register"} className="block mt-auto">
                  <Button 
                    className={cn(
                      "w-full h-14 rounded-2xl font-bold transition-all duration-300",
                      isPopular 
                        ? "bg-blue-500 hover:bg-blue-400 text-white shadow-xl shadow-blue-500/20" 
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                    )}
                  >
                    {isEnterprise ? "Talk to Sales" : "Get Started Now"}
                  </Button>
                </Link>

                <p className="text-center text-[10px] text-muted-foreground mt-6">
                  {isEnterprise ? "No setup fees • Custom SLA" : "14-day free trial • Cancel anytime"}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Pricing FAQ / Trust */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 rounded-3xl bg-card/50 border border-border backdrop-blur-sm">
             <div className="flex flex-col items-center">
               <p className="text-2xl font-bold text-foreground">100%</p>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Safe & Secure</p>
             </div>
             <div className="w-px h-8 bg-border" />
             <div className="flex flex-col items-center">
               <p className="text-2xl font-bold text-foreground">24/7</p>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Support UK</p>
             </div>
             <div className="w-px h-8 bg-border" />
             <div className="flex flex-col items-center">
               <p className="text-2xl font-bold text-foreground">0%</p>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Commission</p>
             </div>
          </div>
          <p className="text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
            Have questions? <Link href="/contact" className="text-primary hover:underline">Chat with our UK team</Link>
            <HelpCircle className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </section>
  );
}
