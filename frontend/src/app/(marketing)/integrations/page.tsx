import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CTASection } from "@/components/marketing/CTASection";
import {
  ShoppingCart,
  Store,
  CreditCard,
  Truck,
  BarChart3,
  Mail,
  Zap,
  CheckCircle,
} from "lucide-react";
import { marketingConfig } from "@/config/marketing";

const iconMap: Record<string, any> = {
  ShoppingCart,
  Store,
  CreditCard,
  Truck,
  BarChart3,
  Mail,
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <Zap className="h-3.5 w-3.5 fill-primary" />
                Ecosystem
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                Connect Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Entire Stack
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                eBay Flow integrates seamlessly with the platforms you already use. 
                One unified dashboard to power your high-volume UK eBay business.
              </p>
            </div>

            <div className="space-y-20">
              {marketingConfig.integrationsPage.categories.map((category) => (
                <div key={category.title}>
                  <h2 className="text-2xl font-bold text-foreground mb-8 ml-2">{category.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item) => {
                      const Icon = iconMap[item.icon] || Store;
                      return (
                        <div
                          key={item.name}
                          className="group p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Icon className="h-7 w-7 text-primary" />
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                                item.status === "Active"
                                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                                  : "bg-muted/50 border-border text-muted-foreground"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-foreground mb-2">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {item.description}
                          </p>
                          
                          <div className="space-y-3">
                            {item.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
