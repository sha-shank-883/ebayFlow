import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Logos } from "@/components/marketing/Logos";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { PricingCards } from "@/components/marketing/PricingCards";
import { AuditSection } from "@/components/marketing/AuditSection";
import { CTASection } from "@/components/marketing/CTASection";
import { Footer } from "@/components/marketing/Footer";
import { WebSiteJsonLd, SoftwareApplicationJsonLd, OrganizationJsonLd, ProductJsonLd } from "@/components/marketing/JsonLd";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <WebSiteJsonLd />
      <SoftwareApplicationJsonLd />
      <OrganizationJsonLd />
      <ProductJsonLd />
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <Features />
        <HowItWorks />
        <Testimonials />
        <PricingCards />
        <AuditSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}