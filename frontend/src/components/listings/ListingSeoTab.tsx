"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ListingSeoTabProps {
  listing: any;
  formData: any;
}

export function ListingSeoTab({ listing, formData }: ListingSeoTabProps) {
  const title = formData.title || "";
  const description = formData.description || "";

  const checks = [
    {
      label: "Title length",
      passed: title.length >= 20 && title.length <= 80,
      message: title.length < 20 ? "Title too short (min 20 chars)" : title.length > 80 ? "Title too long (max 80 chars)" : "Good length",
    },
    {
      label: "Title has keywords",
      passed: title.split(" ").length >= 3,
      message: title.split(" ").length < 3 ? "Add more descriptive keywords" : "Good keyword density",
    },
    {
      label: "Description length",
      passed: description.length >= 100,
      message: description.length < 100 ? "Description too short (min 100 chars)" : "Good description length",
    },
    {
      label: "Has SKU",
      passed: !!formData.sku,
      message: formData.sku ? "SKU set" : "Add a SKU for better tracking",
    },
    {
      label: "Has images",
      passed: (listing.imagesList?.length || 0) >= 1,
      message: listing.imagesList?.length >= 1 ? `${listing.imagesList.length} image(s) added` : "Add at least one image",
    },
    {
      label: "Has item specifics",
      passed: (listing.specifics?.length || 0) >= 3,
      message: listing.specifics?.length >= 3 ? `${listing.specifics.length} specifics added` : "Add at least 3 item specifics",
    },
    {
      label: "Category set",
      passed: !!formData.categoryId,
      message: formData.categoryId ? "Category assigned" : "Assign a category",
    },
    {
      label: "Condition set",
      passed: !!formData.condition,
      message: formData.condition ? "Condition set" : "Set item condition",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  const getScoreColor = (s: number) => {
    if (s >= 90) return "text-emerald-600";
    if (s >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return "bg-emerald-500";
    if (s >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Listing Quality Score</CardTitle>
          <CardDescription>How well optimised your listing is for eBay search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${score * 2.51} 251`}
                  strokeLinecap="round"
                  className={getScoreColor(score)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Work"}
              </p>
              <p className="text-sm text-muted-foreground">
                {passedCount}/{checks.length} checks passed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>SEO Checklist</CardTitle>
          <CardDescription>Improve your listing visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              {check.passed ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.message}</p>
              </div>
              <Badge variant="outline" className={check.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {check.passed ? "Pass" : "Fix"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {listing.aiSuggestions && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(typeof listing.aiSuggestions === "string"
                ? JSON.parse(listing.aiSuggestions)
                : listing.aiSuggestions
              ).map((suggestion: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
