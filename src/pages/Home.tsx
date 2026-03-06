import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Package, BarChart3, Truck, CreditCard, ShoppingBag,
  Shield, Users, Star, Phone, Mail, MessageCircle, MapPin,
  ChevronDown, IndianRupee, Check, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  { name: "Silver", price: "₹1,999", period: "/month", duration: "1 Month - 30 Days access", features: ["Unlimited invoices", "Full inventory management", "Up to 3 users", "Priority support"], popular: false },
  { name: "Gold", price: "₹4,999", period: "/3 months", duration: "3 Months - 90 Days access", features: ["Everything in Silver", "Up to 5 users", "Advanced reports", "E-Way bill integration"], popular: false },
  { name: "Platinum", price: "₹9,999", period: "/6 months", duration: "6 Months - 180 Days access", features: ["Everything in Gold", "Up to 10 users", "Up to 5 businesses", "API access"], popular: true },
  { name: "Diamond", price: "₹17,999", period: "/year", duration: "12 Months - 365 Days access", features: ["Everything in Platinum", "Up to 20 users", "Up to 10 businesses", "Dedicated support", "24/7 priority support"], popular: false },
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

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2.5 text-sm font-medium">
        🎉 Special Offer: Use code <span className="font-bold">HISAB50</span> for 50% off on yearly plans!
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">HisabKitab</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Login</Link>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight">
                <span className="text-emerald-600">Billing Software</span> for{" "}
                <span className="text-teal-600">Small Businesses</span> in India
              </h1>
              <p className="mt-5 text-lg text-slate-500 max-w-lg">
                Create professional invoices, manage inventory, track payments, and grow your business with India's most trusted billing app.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 gap-2 text-base">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base border-slate-300 text-slate-600 hover:bg-slate-50">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-10 flex gap-8">
                {[{ val: "1 Crore+", label: "Happy Customers" }, { val: "4.7 ★", label: "App Rating" }, { val: "Multi", label: "User Support" }].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-emerald-600">{s.val}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block">
              <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 shadow-2xl shadow-emerald-200/30 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700">HisabKitab</h3>
                  <p className="text-sm text-slate-400 mt-1">Dashboard Preview</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Everything You Need to <span className="text-emerald-600">Grow Your Business</span></h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">From billing to inventory to reports — HisabKitab has all the tools you need to run your business efficiently.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="p-6 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <f.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Trusted by <span className="text-emerald-600">1 Crore+</span> Businesses</h2>
            <p className="mt-3 text-slate-500">See what our customers have to say about HisabKitab</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 italic mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.business}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Choose the Perfect Plan <span className="text-emerald-600">for You</span></h2>
            <p className="mt-3 text-slate-500">Select a plan that fits your business needs. All plans include core billing features.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`relative p-6 rounded-xl border ${p.popular ? "border-emerald-400 shadow-lg shadow-emerald-100 ring-2 ring-emerald-400" : "border-slate-200"} bg-white`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
                )}
                <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-800">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.period}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.duration}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block mt-6">
                  <Button className={`w-full rounded-full ${p.popular ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"}`}>
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Frequently Asked <span className="text-emerald-600">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors">
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-5 pb-4">
                    <p className="text-sm text-slate-500">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Get In <span className="text-emerald-600">Touch</span></h2>
            <p className="mt-3 text-slate-500">Have questions? We're here to help.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Phone, label: "Phone", value: "+91 8500 60 6000" },
              { icon: Mail, label: "Email", value: "support@hisabkitab.com" },
              { icon: MessageCircle, label: "WhatsApp", value: "Chat with us" },
              { icon: MapPin, label: "Address", value: "India" },
            ].map((c, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <c.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                <p className="text-sm font-medium text-slate-700">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Transform Your Business?</h2>
          <p className="mt-3 text-emerald-100">Join 1 Crore+ businesses already using HisabKitab.</p>
          <Link to="/auth" className="inline-block mt-6">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-10 text-base font-semibold">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">HisabKitab</span>
          </div>
          <p className="text-sm">© 2026 HisabKitab. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
