import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CTASection } from "@/components/marketing/CTASection";
import { PricingCards } from "@/components/marketing/PricingCards";
import { ShieldCheck, CreditCard, Headphones, Zap, ChevronDown } from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { motion } from "framer-motion";
import { FAQPageJsonLd, OrganizationJsonLd, ProductJsonLd } from "@/components/marketing/JsonLd";

const iconMap = {
  ShieldCheck,
  CreditCard,
  Headphones,
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <FAQPageJsonLd faqs={marketingConfig.pricing.faqs} />
      <Navbar />
      <main className="pt-20">
        <section className="py-20 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <Zap className="h-3.5 w-3.5 fill-primary" />
                Scalable Pricing
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                Investment in your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Business Growth
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Choose the plan that fits your business. Start with a 14-day free trial. 
                No credit card required to start your audit.
              </p>
            </div>

            <PricingCards />

            <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {marketingConfig.pricing.guarantees.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || ShieldCheck;
                return (
                  <div key={item.title} className="group relative p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Everything you need to know about eBay Flow AI billing and plans.
                </p>
              </div>
              
              <div className="grid gap-4">
                {marketingConfig.pricing.faqs.map((faq) => (
                  <div key={faq.q} className="group bg-card/50 border border-border rounded-2xl p-8 hover:bg-card transition-all">
                    <h3 className="text-lg font-bold text-foreground mb-3 flex items-center justify-between">
                      {faq.q}
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
