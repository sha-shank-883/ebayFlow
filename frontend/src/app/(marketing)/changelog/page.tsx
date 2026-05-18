import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Sparkles, Zap, Bug, Shield, Package, BarChart3 } from "lucide-react";

const changelog = [
  {
    version: "v3.2.0",
    date: "May 12, 2025",
    type: "feature",
    title: "AI-Powered Repricing Engine",
    description: "Introducing our new AI repricing engine that automatically adjusts your prices based on competitor analysis, market demand, and your profit margin targets.",
    changes: [
      "New AI repricing engine with customizable rules",
      "Competitor price tracking across all marketplaces",
      "Profit margin protection with minimum price floors",
      "Real-time price adjustment notifications",
    ],
  },
  {
    version: "v3.1.0",
    date: "April 28, 2025",
    type: "feature",
    title: "Advanced Analytics Dashboard",
    description: "A completely redesigned analytics dashboard with new charts, filters, and export capabilities for deeper business insights.",
    changes: [
      "New revenue and profit trend charts",
      "Sales by category breakdown with drill-down",
      "Custom date range selector",
      "CSV and PDF export for all reports",
      "Performance comparison across time periods",
    ],
  },
  {
    version: "v3.0.2",
    date: "April 15, 2025",
    type: "fix",
    title: "Bug Fixes & Performance Improvements",
    description: "Various bug fixes and performance improvements to make your experience smoother.",
    changes: [
      "Fixed inventory sync delay for high-volume accounts",
      "Resolved issue with eBay image upload timeouts",
      "Improved dashboard loading speed by 40%",
      "Fixed pagination bug in orders table",
    ],
  },
  {
    version: "v3.0.0",
    date: "April 1, 2025",
    type: "feature",
    title: "eBay Flow AI v3 - Complete Redesign",
    description: "Our biggest update yet. A completely redesigned platform with improved navigation, faster performance, and powerful new features.",
    changes: [
      "Completely redesigned user interface",
      "New sidebar navigation with quick actions",
      "Improved dashboard with customizable widgets",
      "Faster page loading across the entire platform",
      "Dark mode support",
      "Mobile-responsive design improvements",
    ],
  },
  {
    version: "v2.8.0",
    date: "March 15, 2025",
    type: "feature",
    title: "Multi-Account Management",
    description: "Manage multiple eBay accounts from a single dashboard with seamless switching and unified analytics.",
    changes: [
      "Support for multiple eBay accounts",
      "Quick account switching from the header",
      "Unified analytics across all accounts",
      "Account-specific settings and preferences",
    ],
  },
  {
    version: "v2.7.0",
    date: "February 28, 2025",
    type: "security",
    title: "Enhanced Security Features",
    description: "New security features to keep your account and data safe, including two-factor authentication and improved session management.",
    changes: [
      "Two-factor authentication (2FA) support",
      "Improved session management with device tracking",
      "Enhanced password requirements",
      "Login attempt monitoring and lockout protection",
      "Audit log for all account activities",
    ],
  },
  {
    version: "v2.6.0",
    date: "February 10, 2025",
    type: "feature",
    title: "Bulk Listing Operations",
    description: "Update hundreds of listings at once with our new bulk operations feature.",
    changes: [
      "Bulk price updates across selected listings",
      "Bulk quantity adjustments",
      "Bulk category changes",
      "CSV import/export for bulk operations",
      "Scheduled bulk operations",
    ],
  },
  {
    version: "v2.5.0",
    date: "January 20, 2025",
    type: "feature",
    title: "Inventory Management Overhaul",
    description: "A complete overhaul of our inventory management system with real-time sync, low-stock alerts, and warehouse management.",
    changes: [
      "Real-time inventory synchronization",
      "Customizable low-stock alert thresholds",
      "Warehouse location tracking",
      "SKU management with barcode support",
      "Stock movement history and audit trail",
    ],
  },
];

const typeConfig = {
  feature: { icon: Sparkles, label: "New Feature", color: "text-primary bg-primary-muted" },
  improvement: { icon: Zap, label: "Improvement", color: "text-success bg-success-muted" },
  fix: { icon: Bug, label: "Bug Fix", color: "text-warning bg-warning-muted" },
  security: { icon: Shield, label: "Security", color: "text-destructive bg-destructive-muted" },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-muted text-sm font-medium text-primary mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Changelog
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                What's{" "}
                <span className="text-gradient">New</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stay up to date with the latest improvements, features, and fixes.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {changelog.map((entry) => {
                const config = typeConfig[entry.type as keyof typeof typeConfig] || typeConfig.feature;
                const Icon = config.icon;

                return (
                  <div
                    key={entry.version}
                    className="bg-card rounded-2xl p-6 shadow-card border border-border"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{entry.version}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{entry.date}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>

                    <ul className="space-y-2">
                      {entry.changes.map((change) => (
                        <li key={change} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-muted-foreground">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
