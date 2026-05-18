"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail, User, Building2, Globe, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { marketingConfig } from "@/config/marketing";

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { audit } = marketingConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call to a future endpoint
      // const response = await fetch('/api/marketing/leads', {
      //   method: 'POST',
      //   body: JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement))),
      // });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (error) {
      console.error("Lead submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/20 p-8 rounded-[2rem] text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{audit.form.successTitle}</h3>
        <p className="text-muted-foreground mb-6">
          {audit.form.successDescription}
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
          className="rounded-xl border-border hover:bg-muted text-foreground"
        >
          Send Another Request
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="relative group">
      {/* Decorative Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      
      <form 
        onSubmit={handleSubmit}
        className="relative bg-card border border-border p-8 md:p-10 rounded-[2rem] shadow-2xl"
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">{audit.form.title}</h3>
          <p className="text-sm text-muted-foreground">
            {audit.form.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{audit.form.fields.name.label}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="name"
                  required
                  placeholder={audit.form.fields.name.placeholder}
                  className="bg-muted/50 border-border pl-11 h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{audit.form.fields.email.label}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="email"
                  required
                  type="email"
                  placeholder={audit.form.fields.email.placeholder}
                  className="bg-muted/50 border-border pl-11 h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{audit.form.fields.business.label}</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="business"
                required
                placeholder={audit.form.fields.business.placeholder}
                className="bg-muted/50 border-border pl-11 h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{audit.form.fields.url.label}</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="url"
                placeholder={audit.form.fields.url.placeholder}
                className="bg-muted/50 border-border pl-11 h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-14 mt-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {audit.form.loadingCta}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {audit.form.cta}
              <ArrowRight className="h-5 w-5" />
            </span>
          )}
        </Button>

        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
           {audit.form.guarantees.map((guarantee, i) => (
             <div key={guarantee} className="flex items-center gap-1">
               {i > 0 && <div className="w-1 h-1 rounded-full bg-muted mr-3" />}
               <Check className="h-3 w-3 text-green-500" /> {guarantee}
             </div>
           ))}
        </div>
      </form>
    </div>
  );
}
