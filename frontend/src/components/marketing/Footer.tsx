"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github, Mail, MapPin, Phone } from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useNavigation, useSettings } from "@/lib/admin/use-site-content";

const footerLinks = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/faq" },
    { label: "Community", href: "/community" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Press Kit", href: "/press" },
    { label: "Partners", href: "/partners" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
    { label: "Security", href: "/security" },
  ],
};

export function Footer() {
  const { items: footerNav } = useNavigation("footer");
  const { settings, loading: settingsLoading } = useSettings();

  const contactEmail = settingsLoading ? marketingConfig.contact.email : settings.contactEmail || marketingConfig.contact.email;
  const contactPhone = settingsLoading ? marketingConfig.contact.phone : settings.contactPhone || marketingConfig.contact.phone;
  const contactAddress = settingsLoading ? marketingConfig.contact.address : { line1: settings.contactAddress?.split(",")[0] || "", city: settings.contactAddress?.split(",")[1]?.trim() || "" };

  return (
    <footer className="bg-background border-t border-border relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container px-4 py-20 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <span className="text-white font-black text-sm">EF</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-foreground">
                eBay<span className="text-blue-500">Flow</span>
              </span>
            </Link>
            
            <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
              The high-performance listing engine for the modern UK eBay entrepreneur. 
              Built for speed, scale, and sales.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 <MapPin className="h-4 w-4 text-primary" />
                  {contactAddress.line1}, {contactAddress.city}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 <Phone className="h-4 w-4 text-primary" />
                 {contactPhone}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 <Mail className="h-4 w-4 text-primary" />
                 {contactEmail}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6">Platform</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6">Engine</h4>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6">Compliance</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              &copy; {new Date().getFullYear()} eBay Flow AI. Registered in England & Wales.
            </p>
            <div className="flex gap-4">
               {[Twitter, Linkedin, Github].map((Icon, i) => (
                 <Link key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Icon className="h-4 w-4" />
                 </Link>
               ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-green-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Service Status: Peak
            </span>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 rounded bg-muted border border-border flex items-center justify-center">
                  <span className="text-[8px] font-black text-muted-foreground">UK</span>
               </div>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Ops</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
