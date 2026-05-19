"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Truck,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart4,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { useFeatures, useLogos } from "@/lib/admin/use-site-content";

const iconMap = {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Truck,
  ShieldCheck,
  Zap,
  BarChart4,
  Layers,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Features() {
  const { data: featuresData, loading: featuresLoading } = useFeatures();
  const { items: logos, loading: logosLoading } = useLogos();

  const features = featuresLoading ? {
    badge: marketingConfig.featureSection.badge,
    title: marketingConfig.featureSection.title,
    titleAccent: marketingConfig.featureSection.titleAccent,
    description: marketingConfig.featureSection.description,
    bento: marketingConfig.featureSection.bento,
    services: marketingConfig.services,
  } : (featuresData || {
    badge: marketingConfig.featureSection.badge,
    title: marketingConfig.featureSection.title,
    titleAccent: marketingConfig.featureSection.titleAccent,
    description: marketingConfig.featureSection.description,
    bento: marketingConfig.featureSection.bento,
    services: marketingConfig.services,
  });

  const displayLogos = logosLoading ? marketingConfig.logos : (logos.length > 0 ? logos : marketingConfig.logos);

  const bento = features.bento || marketingConfig.featureSection.bento;

  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      <div className="container px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
              <Zap className="h-3.5 w-3.5 fill-primary" />
              {features.badge}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              {features.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {features.titleAccent}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {features.description}
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.services.map((service: any, index: number) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap] || Sparkles;
            
            return (
              <motion.div
                key={service.title}
                variants={itemVariants}
                className={cn(
                  "group relative p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm transition-all duration-500",
                  "hover:bg-card hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10",
                  index === 0 || index === 3 ? "lg:col-span-1" : "lg:col-span-1"
                )}
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                  
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0"
                  >
                    Deep Dive
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Logos Section */}
        <div className="mt-20 py-12 border-y border-border">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">
            Trusted integrations with platforms you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {displayLogos.map((logo: any) => (
              <div
                key={logo.name}
                className={`text-xl md:text-2xl font-bold ${logo.color} opacity-60 hover:opacity-100 transition-opacity cursor-default`}
              >
                {logo.name}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights / Bento Bottom */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 p-8 rounded-3xl border border-border bg-gradient-to-br from-blue-900/20 to-indigo-900/10 backdrop-blur-md flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{bento.seo.badge}</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{bento.seo.title}</h3>
              <p className="text-muted-foreground mb-6">
                {bento.seo.description}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                {bento.seo.cta}
              </Button>
            </div>
            <div className="w-full md:w-1/2 aspect-video rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-border bg-muted/50 flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/50" />
                 <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                 <div className="w-3 h-3 rounded-full bg-green-500/50" />
               </div>
               <div className="p-4 space-y-3">
                 <div className="h-4 w-3/4 bg-primary/20 rounded animate-pulse" />
                 <div className="h-4 w-1/2 bg-accent/20 rounded animate-pulse delay-75" />
                 <div className="h-24 w-full bg-muted/50 rounded border border-border" />
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm flex flex-col justify-center text-center"
          >
            <div className="mb-6 inline-flex mx-auto p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{bento.uptime.title}</h3>
            <p className="text-sm text-muted-foreground">
              {bento.uptime.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
