"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github, Mail, MapPin, Phone } from "lucide-react";
import { marketingConfig } from "@/config/marketing";
import { useNavigation, useSettings } from "@/lib/admin/use-site-content";

export function Footer() {
  const { items: footerNav, loading: navLoading } = useNavigation("footer");
  const { settings, loading: settingsLoading } = useSettings();

  const contactEmail = settingsLoading ? marketingConfig.contact.email : settings.contactEmail || marketingConfig.contact.email;
  const contactPhone = settingsLoading ? marketingConfig.contact.phone : settings.contactPhone || marketingConfig.contact.phone;
  const contactAddress = settingsLoading
    ? { line1: marketingConfig.contact.address.line1, city: marketingConfig.contact.address.city }
    : {
        line1: settings.contactAddress?.split(",")[0] || marketingConfig.contact.address.line1,
        city: settings.contactAddress?.split(",")[1]?.trim() || marketingConfig.contact.address.city,
      };

  const description = settingsLoading ? marketingConfig.footer.description : settings.description || marketingConfig.footer.description;
  const copyright = settingsLoading ? marketingConfig.footer.copyright : settings.copyright || marketingConfig.footer.copyright;

  const navItems = navLoading
    ? [
        ...marketingConfig.footer.links.platform.map((l: any) => ({ ...l, group: "platform" })),
        ...marketingConfig.footer.links.engine.map((l: any) => ({ ...l, group: "engine" })),
        ...marketingConfig.footer.links.company.map((l: any) => ({ ...l, group: "company" })),
        ...marketingConfig.footer.links.compliance.map((l: any) => ({ ...l, group: "compliance" })),
      ]
    : (footerNav.length > 0 ? footerNav : [
        ...marketingConfig.footer.links.platform.map((l: any) => ({ ...l, group: "platform" })),
        ...marketingConfig.footer.links.engine.map((l: any) => ({ ...l, group: "engine" })),
        ...marketingConfig.footer.links.company.map((l: any) => ({ ...l, group: "company" })),
        ...marketingConfig.footer.links.compliance.map((l: any) => ({ ...l, group: "compliance" })),
      ]);

  const groups = {
    platform: navItems.filter((item: any) => item.group === "platform" || (!item.group && marketingConfig.footer.links.platform.some((l: any) => l.href === item.href))),
    engine: navItems.filter((item: any) => item.group === "engine" || (!item.group && marketingConfig.footer.links.engine.some((l: any) => l.href === item.href))),
    company: navItems.filter((item: any) => item.group === "company" || (!item.group && marketingConfig.footer.links.company.some((l: any) => l.href === item.href))),
    compliance: navItems.filter((item: any) => item.group === "compliance" || (!item.group && marketingConfig.footer.links.compliance.some((l: any) => l.href === item.href))),
  };

  const groupLabels: Record<string, string> = {
    platform: "Platform",
    engine: "Engine",
    company: "Company",
    compliance: "Compliance",
  };

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
              {description}
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

          {Object.entries(groups).map(([key, links]) => (
            <div key={key}>
              <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6">{groupLabels[key]}</h4>
              <ul className="space-y-4">
                {(links as any[]).map((link: any) => (
                  <li key={link.label || link.href}>
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
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {copyright}
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
