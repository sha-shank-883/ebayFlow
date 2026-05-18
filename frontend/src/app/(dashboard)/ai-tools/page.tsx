"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Copy, Sparkles, Wand2, Tag, Loader2, Check, History, BrainCircuit } from "lucide-react";
import toast from "react-hot-toast";

const templates = [
  { id: "title", name: "Listing Title", icon: Tag, description: "Generate SEO-optimized eBay titles", color: "text-brand-400", bg: "bg-brand-500/10" },
  { id: "description", name: "Listing Description", icon: Wand2, description: "Create compelling product descriptions", color: "text-info", bg: "bg-info/10" },
  { id: "pricing", name: "Price Recommendation", icon: Sparkles, description: "AI-powered pricing analysis", color: "text-profit", bg: "bg-profit/10" },
];

export default function AIToolsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [activeTemplate, setActiveTemplate] = useState("title");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter product details");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetchApi<any>("/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          type: activeTemplate === "pricing" ? "title" : activeTemplate,
          prompt,
          tone,
        }),
      });
      setResult(res.content || "");
      toast.success("AI content generated!");
    } catch (error: any) {
      toast.error(error.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Tools</h1>
          <p className="text-muted-foreground">Generate optimized listing content with enterprise AI</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="rounded-xl bg-card border border-border/80 p-1">
          <TabsTrigger 
            value="generate" 
            className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all duration-300 bg-card backdrop-blur-xl border overflow-hidden group ${
                    activeTemplate === t.id 
                      ? "border-brand shadow-lg shadow-brand/10" 
                      : "border-border hover:border-border hover:bg-white/[0.06] shadow-xl"
                  }`}
                  onClick={() => setActiveTemplate(t.id)}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center shrink-0 border border-border group-hover:scale-110 transition-transform`}>
                      <t.icon className={`h-6 w-6 ${t.color}`} />
                    </div>
                    <div>
                      <p className={`font-bold transition-colors ${activeTemplate === t.id ? "text-foreground" : "text-foreground group-hover:text-foreground"}`}>
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{t.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-gradient-to-br from-brand/20 to-[#080D1A] border border-brand/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2 text-brand">
                  <BrainCircuit className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">Pro Tip</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  Be descriptive with your product details. Including features, dimensions, and unique selling points yields better results.
                </p>
              </Card>
            </div>

            <Card className="md:col-span-2 bg-[#0A0F1C] backdrop-blur-xl border border-border rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-brand/10 text-brand border-brand/20">Active Tool</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground">{templates.find((t) => t.id === activeTemplate)?.name} Generator</CardTitle>
                <CardDescription className="text-muted-foreground">Enter product details and let our AI engine create optimized content for your eBay listing.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">Product Details</Label>
                  <Textarea
                    placeholder="e.g., Wireless Bluetooth Headphones with noise cancelling, 40 hour battery, foldable design..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[160px] rounded-2xl bg-card border-border/80 text-foreground placeholder:text-slate-500 focus-visible:ring-brand/50 resize-none p-4"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Writing Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="rounded-xl bg-card border-border/80 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0F1C]/95 border-border/80 text-foreground backdrop-blur-xl">
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()} 
                  className="w-full rounded-2xl py-7 text-lg font-bold bg-gradient-to-r from-brand to-blue-400 text-foreground hover:opacity-90 shadow-lg shadow-brand/20 transition-all active:scale-[0.98]"
                >
                  {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                  {isGenerating ? "Processing AI Magic..." : "Generate Optimized Content"}
                </Button>

                {result && (
                  <div className="space-y-4 pt-8 mt-8 border-t border-border animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-brand-400 font-bold flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        AI Result
                      </Label>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl bg-card border-border/80 text-foreground hover:bg-muted">
                        {copied ? <Check className="mr-2 h-4 w-4 text-profit" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? "Copied!" : "Copy Result"}
                      </Button>
                    </div>
                    <div className="p-6 bg-card border border-border/80 rounded-2xl whitespace-pre-wrap text-foreground leading-relaxed font-medium">
                      {result}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-[#0A0F1C] backdrop-blur-xl border border-border rounded-2xl shadow-xl">
            <CardHeader className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mx-auto mb-4 border border-border">
                <History className="h-8 w-8 text-slate-500" />
              </div>
              <CardTitle className="text-foreground">No history yet</CardTitle>
              <CardDescription className="text-muted-foreground">Your generated content will be automatically saved here for quick access.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

