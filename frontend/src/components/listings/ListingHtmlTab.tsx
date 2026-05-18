"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Code, Copy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ListingHtmlTabProps {
  formData: any;
  updateField: (field: string, value: any) => void;
  listing: any;
}

export function ListingHtmlTab({ formData, updateField, listing }: ListingHtmlTabProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(formData.descriptionHtml || "");
      toast.success("HTML copied to clipboard");
    } catch {
      setIsCopying(true);
      const textarea = document.createElement("textarea");
      textarea.value = formData.descriptionHtml || "";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setIsCopying(false);
      toast.success("HTML copied to clipboard");
    }
  };

  const processedHtml = (formData.descriptionHtml || "")
    .replace(/\{\{title\}\}/g, listing.title || "")
    .replace(/\{\{description\}\}/g, formData.description || "")
    .replace(/\{\{price\}\}/g, `£${Number(formData.price).toFixed(2)}`)
    .replace(/\{\{sku\}\}/g, listing.sku || "")
    .replace(/\{\{shipping\}\}/g, "Free UK Delivery")
    .replace(/\{\{returns\}\}/g, "30 day returns accepted");

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>HTML Description</CardTitle>
              <CardDescription>
                Edit the HTML description for your eBay listing. Supports template variables.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyHtml} disabled={isCopying} className="rounded-xl">
                <Copy className="mr-2 h-4 w-4" />
                Copy HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="rounded-xl">
                {showPreview ? <Code className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            <div className="border rounded-xl p-6 bg-white min-h-[400px]">
              <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
            </div>
          ) : (
            <Textarea
              value={formData.descriptionHtml}
              onChange={(e) => updateField("descriptionHtml", e.target.value)}
              placeholder="<div>Your HTML description here...</div>"
              className="rounded-xl min-h-[400px] font-mono text-sm"
              rows={20}
            />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Template Variables</CardTitle>
          <CardDescription>Use these variables in your HTML template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { var: "{{title}}", desc: "Listing title" },
              { var: "{{description}}", desc: "Plain text description" },
              { var: "{{price}}", desc: "Formatted price" },
              { var: "{{sku}}", desc: "Product SKU" },
              { var: "{{shipping}}", desc: "Shipping info" },
              { var: "{{returns}}", desc: "Returns policy" },
            ].map((item) => (
              <div key={item.var} className="p-3 rounded-lg border bg-muted/30">
                <code className="text-sm font-mono text-primary">{item.var}</code>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
