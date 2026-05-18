"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { marketingConfig } from "@/config/marketing";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-5xl mx-auto overflow-hidden rounded-[3rem] border border-border"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-card" />
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                <Sparkles className="h-3.5 w-3.5 fill-primary" />
                {marketingConfig.ctaSection.badge}
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-8 leading-tight tracking-tight">
                {marketingConfig.ctaSection.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{marketingConfig.ctaSection.titleAccent}</span>
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                {marketingConfig.ctaSection.description}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="rounded-2xl px-10 h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {marketingConfig.ctaSection.primaryCta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl px-10 h-16 border-border text-foreground hover:bg-muted font-bold text-lg backdrop-blur-md"
                  >
                    {marketingConfig.ctaSection.secondaryCta}
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {marketingConfig.ctaSection.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Animated Border Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
