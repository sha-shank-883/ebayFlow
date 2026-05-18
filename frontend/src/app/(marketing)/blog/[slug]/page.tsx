import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import Link from "next/link";
import { Calendar, User, Clock, ArrowLeft, Share2, Twitter, Linkedin } from "lucide-react";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <article className="py-12 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              <span className="text-xs font-medium text-primary bg-primary-muted px-3 py-1 rounded-full">
                AI & Technology
              </span>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-4 mb-6">
                How AI Is Revolutionizing eBay Listing Optimization in 2025
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Alex Richardson
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  May 10, 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  8 min read
                </span>
              </div>

              <div className="h-64 md:h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mb-10 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary/30">EF</span>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The e-commerce landscape is evolving at an unprecedented pace, and artificial intelligence
                  is at the forefront of this transformation. For eBay sellers, AI-powered tools are no
                  longer a luxury—they're a necessity for staying competitive in 2025.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4">The Current State of eBay Selling</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  With over 1.3 billion active listings on eBay and millions of sellers competing for
                  buyer attention, standing out has never been more challenging. Traditional listing
                  optimization methods—manual keyword research, trial-and-error pricing, and generic
                  descriptions—simply can't keep up with the scale and complexity of modern e-commerce.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  This is where AI comes in. By analyzing millions of successful listings, understanding
                  buyer behavior patterns, and continuously learning from market trends, AI-powered
                  tools can optimize your listings in ways that were previously impossible.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4">How AI Optimizes Your Listings</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  AI listing optimization works on multiple levels simultaneously. First, natural language
                  processing (NLP) analyzes your product information and generates titles that include
                  the most relevant search terms while remaining readable and compelling.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Second, machine learning algorithms analyze competitor pricing, historical sales data,
                  and market demand to recommend optimal pricing strategies. This isn't just about being
                  the cheapest—it's about finding the sweet spot where visibility meets profitability.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-3">Title Optimization</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  eBay's search algorithm weighs titles heavily when determining listing relevance.
                  AI tools analyze top-performing listings in your category to identify the most
                  effective keyword combinations, word order, and formatting patterns. The result?
                  Titles that rank higher in search results while still appealing to human buyers.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-3">Description Generation</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  AI-generated descriptions go beyond simple template filling. They understand product
                  context, highlight key selling points, and structure information in a way that's
                  both scannable and persuasive. The best AI tools can generate descriptions that
                  convert 30-50% better than manually written ones.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4">The Numbers Don't Lie</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Our data shows that sellers using AI-powered listing optimization see an average
                  increase of 40% in listing views, 25% improvement in conversion rates, and 35%
                  reduction in time spent on listing creation. For sellers managing hundreds or
                  thousands of listings, this translates to hundreds of hours saved and thousands
                  of pounds in additional revenue.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4">Getting Started with AI</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The beauty of modern AI tools is that they're incredibly easy to use. You don't need
                  technical expertise or data science knowledge. Simply connect your eBay account,
                  select the listings you want to optimize, and let the AI do the heavy lifting.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  At eBay Flow AI, we've made this process even simpler. Our platform integrates
                  directly with eBay, analyzes your existing listings, and provides optimization
                  recommendations that you can apply with a single click. It's like having a team
                  of listing experts working for you 24/7.
                </p>

                <div className="bg-primary-muted rounded-xl p-6 my-8">
                  <h4 className="font-semibold mb-2">Ready to Transform Your Listings?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join 10,000+ sellers who are already using AI to grow their eBay business.
                    Start your free 14-day trial today.
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Get Started Free
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-10 pt-8 border-t border-border">
                <span className="text-sm text-muted-foreground">Share:</span>
                <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <Twitter className="h-4 w-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <Linkedin className="h-4 w-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
