"use client";

import { motion } from "framer-motion";
import { Zap, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const router = useRouter();

  const handleLinkEbay = async () => {
    try {
      const result = await fetchApi<{ authUrl: string }>("/ebay/auth-url");
      if (result?.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast.error("Failed to get eBay authorization URL");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect eBay");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg shadow-primary/20">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Welcome to eBay Flow AI</h1>
          <p className="text-muted-foreground text-lg">Let's get your eBay UK business connected and automated.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden group border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer" onClick={handleLinkEbay}>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <LinkIcon className="w-5 h-5" />
              </div>
              <CardTitle>Link eBay Account</CardTitle>
              <CardDescription>
                Connect your eBay account to start syncing inventory and orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Connect Now</Button>
            </CardContent>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          </Card>

          <Card className="opacity-60 grayscale cursor-not-allowed">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <CardTitle>Configure Settings</CardTitle>
              <CardDescription>
                Set up your VAT, shipping preferences, and AI listing rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>Locked</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="link" onClick={() => router.push('/dashboard')}>
            Skip for now (View Demo)
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
