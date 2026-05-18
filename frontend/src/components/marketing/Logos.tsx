"use client";

import { motion } from "framer-motion";

import { marketingConfig } from "@/config/marketing";

export function Logos() {
  return (
    <section className="py-16 border-y border-border bg-muted/20">
      <div className="container px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-muted-foreground mb-8"
        >
          Trusted integrations with platforms you already use
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {marketingConfig.logos.map((logo) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`text-xl md:text-2xl font-bold ${logo.color} opacity-60 hover:opacity-100 transition-opacity cursor-default`}
            >
              {logo.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
