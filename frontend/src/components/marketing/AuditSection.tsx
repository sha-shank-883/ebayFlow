"use client";

import { motion } from "framer-motion";
import { LeadForm } from "./LeadForm";
import * as Icons from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useAuditSection } from "@/lib/admin/use-site-content";

export function AuditSection() {
  const { data: apiData, loading } = useAuditSection();
  const audit = loading ? marketingConfig.audit : (apiData || marketingConfig.audit);
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];
  const features = audit.features || [];

  return (
    <section id="audit" className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px]" />

      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
              {audit.badge}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
              {audit.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {audit.titleAccent}
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              {audit.description}
            </p>

            <div className="space-y-6">
              {features.map((item: any, i: number) => {
                const Icon = (Icons as any)[item.icon];
                return (
                  <div key={i} className="flex gap-4 group">
                    <div className="mt-1 w-12 h-12 rounded-xl bg-card/50 border border-border flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10 group-hover:border-primary/20">
                      {Icon && <Icon className="h-6 w-6 text-primary" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LeadForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
