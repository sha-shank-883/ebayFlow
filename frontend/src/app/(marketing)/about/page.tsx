"use client";

import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CTASection } from "@/components/marketing/CTASection";
import { 
  Target, 
  Heart, 
  Users, 
  Award, 
  Building2, 
  GraduationCap, 
  Zap,
  Globe
} from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useAboutPageContent } from "@/lib/admin/use-site-content";

const iconMap: Record<string, any> = {
  Target,
  Heart,
  Users,
  Award,
};

export default function AboutPage() {
  const { data: aboutData, loading } = useAboutPageContent();

  const about = loading ? {
    mission: "To democratize enterprise-grade automation for eBay sellers worldwide. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.",
    vision: "To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.",
    values: marketingConfig.aboutPage.values,
    milestones: marketingConfig.aboutPage.milestones,
  } : (aboutData || {
    mission: "To democratize enterprise-grade automation for eBay sellers worldwide. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.",
    vision: "To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.",
    values: marketingConfig.aboutPage.values,
    milestones: marketingConfig.aboutPage.milestones,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-24">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <Globe className="h-3.5 w-3.5 fill-primary" />
                Our Mission
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                Built by Sellers, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  for Sellers
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                eBay Flow AI was born from frustration in the e-commerce world. 
                We're on a mission to empower every eBay seller worldwide with enterprise-grade AI tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-32 max-w-5xl mx-auto">
              <div className="group p-10 rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-md hover:bg-card transition-all">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {about.mission}
                </p>
              </div>
              <div className="group p-10 rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-md hover:bg-card transition-all">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-8">
                  <GraduationCap className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {about.vision}
                </p>
              </div>
            </div>

            <div className="mb-32">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-16">
                Our Core Values
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {about.values.map((value: any) => {
                  const Icon = iconMap[value.icon] || Target;
                  return (
                    <div
                      key={value.title}
                      className="group p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-3">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-4">
                Our Journey
              </h2>
              <p className="text-muted-foreground text-center mb-20 text-lg">
                From a small startup to powering thousands of businesses worldwide.
              </p>
              <div className="space-y-12">
                {about.milestones.map((milestone: any, index: number) => (
                  <div key={index} className="flex gap-8 group">
                    <div className="w-24 shrink-0 pt-1 text-right">
                      <span className="text-xl font-black text-primary/50 group-hover:text-primary transition-colors">{milestone.year}</span>
                    </div>
                    <div className="relative pl-8 border-l-2 border-border group-hover:border-primary/30 transition-colors pb-8">
                      <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-muted border-2 border-background group-hover:bg-primary group-hover:scale-125 transition-all" />
                      <h4 className="text-xl font-bold text-foreground mb-2">{milestone.event}</h4>
                      <p className="text-muted-foreground leading-relaxed">{milestone.detail}</p>
                    </div>
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
