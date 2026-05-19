"use client";

import { motion } from "framer-motion";
import { 
  Upload, 
  Wand2, 
  Rocket, 
  CheckCircle, 
  Zap,
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useHowItWorks } from "@/lib/admin/use-site-content";

const iconMap: Record<string, any> = {
  Upload,
  Wand2,
  Rocket,
  Zap,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
};

export function HowItWorks() {
  const { data: apiData, loading } = useHowItWorks();
  const howItWorks = loading ? marketingConfig.howItWorks : (apiData || marketingConfig.howItWorks);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Zap className="h-3.5 w-3.5 fill-primary" />
            {howItWorks.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {howItWorks.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {howItWorks.titleAccent}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {howItWorks.description}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {howItWorks.steps.map((step: any, index: number) => {
            const Icon = iconMap[step.icon] || Rocket;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative flex flex-col md:flex-row gap-8 items-start mb-16 last:mb-0"
              >
                {index < howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute left-8 top-16 w-0.5 h-full bg-border" />
                )}

                <div className="flex flex-col items-center md:w-16 shrink-0">
                  <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 relative z-10 border border-white/20">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="mt-4 text-xs font-black text-primary uppercase tracking-widest">
                    Step 0{index + 1}
                  </div>
                </div>

                <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-10 border border-border hover:border-primary/20 transition-colors">
                  <h3 className="text-2xl font-bold text-foreground mb-4">{step.title}</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {step.details.map((detail: string) => (
                      <div
                        key={detail}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <CheckCircle className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground/80">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
