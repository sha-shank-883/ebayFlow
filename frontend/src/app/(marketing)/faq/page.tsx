"use client";

import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CTASection } from "@/components/marketing/CTASection";
import { ChevronDown, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { useFAQs, usePageMetadata } from "@/lib/admin/use-site-content";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const { categories, loading } = useFAQs();
  const { data: metadata, loading: metadataLoading } = usePageMetadata("faq");

  const faqData = loading ? marketingConfig.faqPage.categories : (categories.length > 0 ? categories : marketingConfig.faqPage.categories);

  const toggleQuestion = (question: string) => {
    setOpenQuestions((prev) => ({ ...prev, [question]: !prev[question] }));
  };

  const filteredCategories = faqData
    .map((category: any) => ({
      ...category,
      questions: (category.items || category.questions || []).filter(
        (q: any) =>
          (q.q || q.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.a || q.answer || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category: any) => category.questions.length > 0);

  const metaBadge = metadataLoading || metadata?.fallback ? "Help Center" : metadata?.badge || "Help Center";
  const metaH1 = metadataLoading || metadata?.fallback ? (
    <>
      Frequently Asked <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
        Questions
      </span>
    </>
  ) : metadata?.h1 || (
    <>
      Frequently Asked <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
        Questions
      </span>
    </>
  );
  const metaDescription = metadataLoading || metadata?.fallback
    ? "Find answers to common questions about eBay Flow AI. Can't find what you're looking for? Contact our UK support team."
    : metadata?.description || "Find answers to common questions about eBay Flow AI. Can't find what you're looking for? Contact our UK support team.";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 right-0 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <MessageCircle className="h-3.5 w-3.5" />
                {metaBadge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                {metaH1}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {metaDescription}
              </p>
            </div>

            <div className="max-w-xl mx-auto mb-20">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-card/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-16">
              {filteredCategories.map((category: any) => (
                <div key={category.name || category.title}>
                  <h2 className="text-2xl font-bold text-foreground mb-6 pl-4 border-l-4 border-primary">{category.name || category.title}</h2>
                  <div className="space-y-4">
                    {category.questions.map((item: any) => {
                      const q = item.q || item.question || "";
                      const a = item.a || item.answer || "";
                      return (
                        <div
                          key={q}
                          className={cn(
                            "group rounded-2xl border transition-all duration-300",
                            openQuestions[q] 
                              ? "bg-card border-border/50" 
                              : "bg-card/50 border-border hover:border-border/70 hover:bg-card"
                          )}
                        >
                          <button
                            onClick={() => toggleQuestion(q)}
                            className="w-full flex items-center justify-between p-6 text-left"
                          >
                            <span className={cn(
                              "font-semibold transition-colors",
                              openQuestions[q] ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}>
                              {q}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                                openQuestions[q] ? "rotate-180 text-primary" : ""
                              )}
                            />
                          </button>
                          {openQuestions[q] && (
                            <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-300">
                              <p className="text-muted-foreground leading-relaxed border-t border-border pt-4">
                                {a}
                              </p>
                            </div>
                          )}
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
