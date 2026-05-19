"use client";

import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CTASection } from "@/components/marketing/CTASection";
import { 
  Zap, 
  Brain, 
  Package, 
  BarChart3, 
  TrendingUp, 
  RefreshCw, 
  Search, 
  Layers, 
  FileText, 
  Tag, 
  Image, 
  Bell, 
  Download,
  CheckCircle
} from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { useFeaturePageContent } from "@/lib/admin/use-site-content";

const iconMap: Record<string, any> = {
  Brain,
  Package,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Search,
  Layers,
  FileText,
  Tag,
  Image,
  Bell,
  Download,
};

export default function FeaturesPage() {
  const { data: featureData, loading } = useFeaturePageContent();

  const featurePage = loading ? {
    sections: marketingConfig.featurePage.sections,
    comparison: marketingConfig.featurePage.comparison,
  } : (featureData || {
    sections: marketingConfig.featurePage.sections,
    comparison: marketingConfig.featurePage.comparison,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-24">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <Zap className="h-3.5 w-3.5 fill-primary" />
                Product Capabilities
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                Built for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Precision & Scale
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Everything you need to manage, optimize, and scale your eBay business.
                The only listing management tool built specifically for high-volume eBay marketplaces worldwide.
              </p>
            </div>

            <div className="space-y-32">
              {featurePage.sections.map((section: any, idx: number) => {
                const SectionIcon = iconMap[section.icon] || Zap;
                return (
                  <div key={section.id} id={section.id} className="relative">
                    <div className="flex flex-col md:flex-row items-start gap-12 mb-12">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <SectionIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{section.title}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl">{section.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {section.features.map((feature: any) => {
                        const FeatureIcon = iconMap[feature.icon] || CheckCircle;
                        return (
                          <div
                            key={feature.title}
                            className="group p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-all duration-300"
                          >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <FeatureIcon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-32 relative bg-muted/20">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Plan Comparison
              </h2>
              <p className="text-muted-foreground text-lg">
                Find the perfect fit for your current volume and growth trajectory.
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {featurePage.comparison.headers.map((header: string, i: number) => (
                        <th 
                          key={header} 
                          className={cn(
                            "py-6 px-8 text-sm font-bold uppercase tracking-widest",
                            i === 0 ? "text-foreground" : i === 2 ? "text-primary text-center" : "text-foreground text-center"
                          )}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {featurePage.comparison.rows.map((row: string[], i: number) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        {row.map((cell: string, j: number) => (
                          <td 
                            key={j} 
                            className={cn(
                              "py-5 px-8",
                              j === 0 ? "text-foreground/80 font-medium" : j === 2 ? "text-center text-primary font-bold" : "text-center text-muted-foreground"
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
