"use client";

import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const { contactPage } = marketingConfig;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(contactPage.form.success);
    setFormData({ name: "", email: "", company: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Orbs */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full" />
          
          <div className="container px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                <MessageCircle className="h-3.5 w-3.5" />
                {contactPage.badge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                {contactPage.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  {contactPage.titleAccent}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {contactPage.description}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-card rounded-[32px] p-8 md:p-10 border border-border backdrop-blur-xl shadow-2xl">
                  <h2 className="text-2xl font-bold text-foreground mb-8">{contactPage.form.title}</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground/80 ml-1">{contactPage.form.fields.name.label}</Label>
                      <Input
                        id="name"
                        placeholder={contactPage.form.fields.name.placeholder}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-14 rounded-2xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground/80 ml-1">{contactPage.form.fields.email.label}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={contactPage.form.fields.email.placeholder}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-14 rounded-2xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-foreground/80 ml-1">{contactPage.form.fields.company.label}</Label>
                      <Input
                        id="company"
                        placeholder={contactPage.form.fields.company.placeholder}
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="h-14 rounded-2xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-foreground/80 ml-1">{contactPage.form.fields.subject.label}</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-border text-foreground focus:border-primary/50 transition-all">
                          <SelectValue placeholder={contactPage.form.fields.subject.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                          {contactPage.form.fields.subject.options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="focus:bg-primary">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 mb-8">
                    <Label htmlFor="message" className="text-foreground/80 ml-1">{contactPage.form.fields.message.label}</Label>
                    <Textarea
                      id="message"
                      placeholder={contactPage.form.fields.message.placeholder}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="rounded-2xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all duration-300"
                  >
                    {isSubmitting ? (
                      contactPage.form.loadingCta
                    ) : (
                      <>
                        {contactPage.form.cta}
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <div className="space-y-8">
                <div className="bg-card rounded-[32px] p-8 border border-border backdrop-blur-xl">
                  <h3 className="text-xl font-bold text-foreground mb-6">{contactPage.info.title}</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Email</p>
                        <a href={`mailto:${marketingConfig.contact.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                          {marketingConfig.contact.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Phone</p>
                        <a href={`tel:${marketingConfig.contact.phone.replace(/\s/g, '')}`} className="text-muted-foreground hover:text-primary transition-colors">
                          {marketingConfig.contact.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Office</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {marketingConfig.contact.address.line1}<br />
                          {marketingConfig.contact.address.city}, {marketingConfig.contact.address.postcode}<br />
                          {marketingConfig.contact.address.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">{contactPage.info.hours.title}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {contactPage.info.hours.detail}<br />
                          {contactPage.info.hours.weekend}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
                  <h3 className="text-xl font-bold mb-3 relative z-10">{contactPage.info.immediate.title}</h3>
                  <p className="text-blue-100 mb-6 relative z-10 leading-relaxed">
                    {contactPage.info.immediate.description}
                  </p>
                  <a href="/faq" className="inline-flex items-center gap-2 font-bold hover:gap-3 transition-all relative z-10">
                    {contactPage.info.immediate.linkText}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
