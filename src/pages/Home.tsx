import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Package, BarChart3, Truck, CreditCard, ShoppingBag,
  Shield, Users, Star, Phone, Mail, MessageCircle, MapPin,
  ChevronDown, IndianRupee, Check, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: FileText, title: "GST Billing", desc: "Create professional GST-compliant invoices with automatic tax calculations" },
  { icon: Package, title: "Inventory Management", desc: "Track stock levels, get low stock alerts, and manage multiple warehouses" },
  { icon: BarChart3, title: "Business Reports", desc: "Comprehensive reports for sales, purchases, profit & loss, and more" },
  { icon: Truck, title: "E-Way Bill", desc: "Generate and manage e-way bills directly from your invoices" },
  { icon: CreditCard, title: "Payment Collection", desc: "Track payments, manage receivables, and send payment reminders" },
  { icon: ShoppingBag, title: "Purchase & Expenses", desc: "Record purchase bills, track expenses, and manage vendor payments" },
  { icon: Shield, title: "Data Security", desc: "Your data is encrypted and backed up automatically in the cloud" },
  { icon: Users, title: "Multi-User Support", desc: "Add team members with role-based access control" },
];

const testimonials = [
  { name: "Rajesh Kumar", business: "Kumar Electronics, Mumbai", text: "HisabKitab has transformed how we manage our business. GST billing is now a breeze!" },
  { name: "Priya Sharma", business: "Sharma Textiles, Delhi", text: "The inventory management feature saved us from stockouts. Highly recommended!" },
  { name: "Mohammed Ali", business: "Ali Trading Co., Hyderabad", text: "Best billing software for small businesses. Simple to use and very affordable." },
];

const plans = [
  { name: "Silver", price: "₹1,999", features: ["Unlimited invoices", "Full inventory management", "Up to 3 users", "Priority support"], popular: false },
  { name: "Gold", price: "₹4,999", features: ["Everything in Silver", "Up to 5 users", "Advanced reports", "E-Way bill integration"], popular: false },
  { name: "Platinum", price: "₹8,999", features: ["Everything in Gold", "Up to 10 users", "Up to 5 businesses", "API access"], popular: true },
  { name: "Diamond", price: "₹16,999", features: ["Everything in Platinum", "Up to 20 users", "Up to 10 businesses", "Dedicated support", "24/7 priority support"], popular: false },
];

const faqs = [
  { q: "Is HisabKitab GST compliant?", a: "Yes, HisabKitab is fully GST compliant. You can create GST invoices, generate GSTR-1, GSTR-3B reports, and manage HSN codes." },
  { q: "Can I use HisabKitab on mobile?", a: "Yes, HisabKitab is a web application that works on any device — desktop, tablet, or mobile browser." },
  { q: "Is my data secure?", a: "Absolutely. All data is encrypted, stored on secure servers, and automatically backed up to prevent data loss." },
  { q: "Can I import my existing data?", a: "Yes, you can import products, customers, and suppliers from Excel/CSV files using our bulk import feature." },
  { q: "Do you offer customer support?", a: "Yes, we offer priority support via email, phone, and WhatsApp for all paid plans." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bannerText, setBannerText] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase
        .from("discount_codes")
        .select("code, discount_type, discount_value, banner_text")
        .eq("is_active", true)
        .not("banner_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.banner_text) {
        setBannerText(data.banner_text);
      }
    };
    fetchBanner();
  }, []);

  return (
    <div className="min-h-screen bg-card text-foreground">
      {/* Top Banner */}
      {bannerText && (
        <div className="bg-gradient-to-r from-[hsl(var(--banner-from))] to-[hsl(var(--banner-to))] text-primary-foreground text-center py-2.5 text-sm font-medium">
          🎉 {bannerText}
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">HisabKitab</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--hero-bg-from))] via-card to-[hsl(var(--hero-bg-to))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight">
                <span className="text-hero-title">Billing Software</span> for{" "}
                <span className="text-hero-subtitle">Small Businesses</span> in India
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-lg">
                Create professional invoices, manage inventory, track payments, and grow your business with India's most trusted billing app.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 gap-2 text-base">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base border-border text-muted-foreground hover:bg-muted">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-10 flex gap-8">
                {[{ val: "1 Crore+", label: "Happy Customers" }, { val: "4.7 ★", label: "App Rating" }, { val: "Multi", label: "User Support" }].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-primary">{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block">
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-card to-[hsl(var(--hero-bg-to))] border border-border shadow-2xl shadow-secondary/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">HisabKitab</h3>
                  <p className="text-sm text-muted-foreground mt-1">Dashboard Preview</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Everything You Need to <span className="text-secondary">Grow Your Business</span></h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">From billing to inventory to reports — HisabKitab has all the tools you need to run your business efficiently.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="p-6 rounded-xl border border-border hover:border-[hsl(var(--feature-hover-border))] hover:shadow-lg hover:shadow-[hsl(var(--feature-hover-shadow))] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--feature-icon-bg))] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--feature-icon-bg))/80] transition-colors">
                  <f.icon className="w-6 h-6 text-feature-icon" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-[hsl(var(--section-alt-bg))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Trusted by <span className="text-primary">1 Crore+</span> Businesses</h2>
            <p className="mt-3 text-muted-foreground">See what our customers have to say about HisabKitab</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-testimonial-star text-testimonial-star" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.business}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Choose the Perfect Plan <span className="text-primary">for You</span></h2>
            <p className="mt-3 text-muted-foreground">Select a plan that fits your business needs. All plans include core billing features.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`relative p-6 rounded-xl border ${p.popular ? "border-primary shadow-lg shadow-[hsl(var(--plan-popular-shadow))] ring-2 ring-primary" : "border-border"} bg-card`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
                )}
                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.duration}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block mt-6">
                  <Button className={`w-full rounded-full ${p.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[hsl(var(--section-alt-bg))]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Frequently Asked <span className="text-primary">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Get In <span className="text-primary">Touch</span></h2>
            <p className="mt-3 text-muted-foreground">Have questions? We're here to help.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Phone, label: "Phone", value: "+91 8500 60 6000" },
              { icon: Mail, label: "Email", value: "support@hisabkitab.com" },
              { icon: MessageCircle, label: "WhatsApp", value: "Chat with us" },
              { icon: MapPin, label: "Address", value: "India" },
            ].map((c, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--feature-icon-bg))] flex items-center justify-center mx-auto mb-3">
                  <c.icon className="w-5 h-5 text-feature-icon" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                <p className="text-sm font-medium text-foreground">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[hsl(var(--cta-from))] to-[hsl(var(--cta-to))]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to Transform Your Business?</h2>
          <p className="mt-3 text-primary-foreground/80">Join 1 Crore+ businesses already using HisabKitab.</p>
          <Link to="/auth" className="inline-block mt-6">
            <Button size="lg" className="bg-card text-primary hover:bg-card/90 rounded-full px-10 text-base font-semibold">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(var(--footer-bg))] text-footer-text py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-primary-foreground">HisabKitab</span>
          </div>
          <p className="text-sm">© 2026 HisabKitab. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
