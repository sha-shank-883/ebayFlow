"use client";

import { motion } from "framer-motion";
import { Star, Quote, TrendingUp } from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useTestimonials } from "@/lib/admin/use-site-content";

export function Testimonials() {
  const { items, loading } = useTestimonials();
  const testimonialsData = loading ? marketingConfig.testimonials : {
    ...marketingConfig.testimonials,
    items: items.length > 0 ? items : marketingConfig.testimonials.items,
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {testimonialsData.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {testimonialsData.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {testimonialsData.titleAccent}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {testimonialsData.description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonialsData.items.map((testimonial: any, index: number) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-border hover:border-primary/20 hover:bg-card transition-all duration-300"
            >
              <Quote className="h-10 w-10 text-primary/20 mb-6 group-hover:text-primary/40 transition-colors" />
              
              <p className="text-foreground/80 leading-relaxed mb-8 italic">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                    {testimonial.stats}
                  </span>
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
