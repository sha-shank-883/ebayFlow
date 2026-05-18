import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import Link from "next/link";
import { Calendar, User, ArrowRight, Clock } from "lucide-react";

const posts = [
  {
    slug: "ai-ebay-listing-optimization-2025",
    title: "How AI Is Revolutionizing eBay Listing Optimization in 2025",
    excerpt:
      "Discover how artificial intelligence is transforming the way sellers create, optimize, and manage their eBay listings for maximum visibility and sales.",
    category: "AI & Technology",
    date: "May 10, 2025",
    author: "Alex Richardson",
    readTime: "8 min read",
    image: "bg-gradient-to-br from-primary/20 to-accent/20",
  },
  {
    slug: "ebay-fee-structure-guide",
    title: "The Complete Guide to eBay Fees in 2025: What Every Seller Needs to Know",
    excerpt:
      "A comprehensive breakdown of all eBay fees including insertion fees, final value fees, payment processing fees, and how to minimize your costs.",
    category: "Seller Guide",
    date: "May 5, 2025",
    author: "Sarah Thompson",
    readTime: "12 min read",
    image: "bg-gradient-to-br from-success/20 to-primary/20",
  },
  {
    slug: "inventory-management-best-practices",
    title: "Inventory Management Best Practices for High-Volume eBay Sellers",
    excerpt:
      "Learn the strategies and tools that top eBay sellers use to manage thousands of SKUs without overselling or running out of stock.",
    category: "Inventory",
    date: "April 28, 2025",
    author: "Marcus Webb",
    readTime: "10 min read",
    image: "bg-gradient-to-br from-warning/20 to-destructive/20",
  },
  {
    slug: "ebay-seo-tips-2025",
    title: "10 eBay SEO Tips That Will Double Your Listing Visibility",
    excerpt:
      "Master eBay's search algorithm with these proven SEO techniques. From title optimization to category selection, we cover everything you need.",
    category: "SEO",
    date: "April 20, 2025",
    author: "Priya Sharma",
    readTime: "7 min read",
    image: "bg-gradient-to-br from-accent/20 to-info/20",
  },
  {
    slug: "scaling-ebay-business",
    title: "From Side Hustle to Full-Time: Scaling Your eBay Business to 6 Figures",
    excerpt:
      "Real stories from sellers who turned their eBay side hustle into a full-time business generating over £100,000 in annual revenue.",
    category: "Growth",
    date: "April 15, 2025",
    author: "James O'Brien",
    readTime: "15 min read",
    image: "bg-gradient-to-br from-primary/20 to-success/20",
  },
  {
    slug: "ebay-seller-performance-metrics",
    title: "Understanding eBay Seller Performance Metrics: A Complete Guide",
    excerpt:
      "Everything you need to know about eBay's seller performance standards, defect rates, and how to maintain top-rated seller status.",
    category: "Seller Guide",
    date: "April 8, 2025",
    author: "Emily Taylor",
    readTime: "9 min read",
    image: "bg-gradient-to-br from-info/20 to-primary/20",
  },
];

const categories = ["All", "AI & Technology", "Seller Guide", "Inventory", "SEO", "Growth"];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                The eBay Flow{" "}
                <span className="text-gradient">Blog</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Tips, guides, and insights to help you grow your eBay business.
                Written by experts, for sellers.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-primary hover:text-white transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-card-hover transition-all"
                >
                  <div className={`h-48 ${post.image} flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-primary/30">EF</span>
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-medium text-primary bg-primary-muted px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <h3 className="font-semibold mt-3 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
