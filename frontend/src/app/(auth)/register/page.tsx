"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Store, ArrowRight, Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", workspaceName: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, requirements: { length: false, uppercase: false, lowercase: false, number: false, special: false } });

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password") {
      const p = e.target.value;
      const req = { length: p.length >= 8, uppercase: /[A-Z]/.test(p), lowercase: /[a-z]/.test(p), number: /\d/.test(p), special: /[@$!%*?&]/.test(p) };
      setPasswordStrength({ score: Object.values(req).filter(Boolean).length, requirements: req });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      const response = await fetchApi<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: `${formData.firstName} ${formData.lastName}`.trim(), email: formData.email, password: formData.password, workspaceName: formData.workspaceName || `${formData.firstName}'s Store` }),
      });
      setUser(response.user, response.accessToken);
      toast.success("Account created! Welcome to eBay Flow.");
      router.push("/onboarding");
    } catch (error: any) {
      if (error.fieldErrors) setFieldErrors(error.fieldErrors);
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = [
    { key: "length" as const, label: "At least 8 characters" },
    { key: "uppercase" as const, label: "Uppercase letter" },
    { key: "lowercase" as const, label: "Lowercase letter" },
    { key: "number" as const, label: "Number" },
    { key: "special" as const, label: "Special character (@$!%*?&)" },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-center bg-gradient-primary p-12 text-white relative overflow-hidden order-2">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4">Start Selling Smarter Today</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            Create your free account and get access to AI-powered tools that will transform your eBay business.
          </p>
          <div className="space-y-4">
            {["14-day free trial, no credit card required", "AI-powered listing optimization", "Real-time inventory management", "Advanced analytics dashboard"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 order-1">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-sm">EF</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                eBay<span className="text-gradient">Flow</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground">Start your 14-day free trial today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="firstName" name="firstName" placeholder="John" required className="pl-10 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted transition-colors" value={formData.firstName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" placeholder="Doe" required className="rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted transition-colors" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="m@example.com" required className="pl-10 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted transition-colors" value={formData.email} onChange={handleChange} />
              </div>
              {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type="password" required className="pl-10 rounded-xl bg-muted/50 border-border text-foreground focus:bg-muted transition-colors" value={formData.password} onChange={handleChange} />
              </div>
              {formData.password && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? (passwordStrength.score >= 4 ? "bg-green-500" : passwordStrength.score >= 3 ? "bg-yellow-500" : "bg-red-500") : "bg-muted"}`} />
                    ))}
                  </div>
                  <ul className="text-xs space-y-1">
                    {requirements.map((r) => (
                      <li key={r.key} className={`flex items-center gap-1.5 ${passwordStrength.requirements[r.key] ? "text-green-500" : "text-muted-foreground"}`}>
                        {passwordStrength.requirements[r.key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace / Store Name</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="workspaceName" name="workspaceName" placeholder="My Awesome Store" className="pl-10 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted transition-colors" value={formData.workspaceName} onChange={handleChange} />
              </div>
              {fieldErrors.workspaceName && <p className="text-sm text-destructive">{fieldErrors.workspaceName[0]}</p>}
            </div>

            <Button type="submit" disabled={isLoading || passwordStrength.score < 5} className="w-full rounded-xl bg-gradient-primary text-white hover:opacity-90 transition-opacity border-0 mt-4">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl bg-muted/50 border-border text-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`;
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
