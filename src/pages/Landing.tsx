// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Package, 
  BarChart3, 
  Truck, 
  CreditCard, 
  ShoppingCart, 
  Shield, 
  Check, 
  Star, 
  Phone, 
  Mail, 
  MapPin,
  Menu,
  X,
  ChevronDown,
  Play,
  Download,
  Users,
  Smartphone,
  Monitor,
  MessageCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { TrialRequestForm } from "@/components/TrialRequestForm";

const features = [
  {
    icon: FileText,
    title: "Excise Billing",
    description: "Create professional GST-compliant invoices with automatic tax calculations"
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track stock levels, get low stock alerts, and manage multiple warehouses"
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    description: "Comprehensive reports for sales, purchases, profit & loss, and more"
  },
  {
    icon: Truck,
    title: "E-Way Bill",
    description: "Generate and manage e-way bills directly from your invoices"
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    description: "Track payments, manage receivables, and send payment reminders"
  },
  {
    icon: ShoppingCart,
    title: "Purchase & Expenses",
    description: "Record purchase bills, track expenses, and manage vendor payments"
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your data is encrypted and backed up automatically in the cloud"
  },
  {
    icon: Users,
    title: "Multi-User Support",
    description: "Add team members with role-based access control"
  }
];

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
}

const testimonials = [
  {
    name: "Rajesh Kumar",
    business: "Kumar Electronics",
    location: "Mumbai",
    content: "HisabKitab-Pro has transformed how we manage our business. GST billing is now a breeze!",
    rating: 5
  },
  {
    name: "Priya Sharma",
    business: "Sharma Textiles",
    location: "Delhi",
    content: "The inventory management feature saved us from stockouts. Highly recommended!",
    rating: 5
  },
  {
    name: "Mohammed Ali",
    business: "Ali Trading Co.",
    location: "Hyderabad",
    content: "Best billing software for small businesses. Simple to use and very affordable.",
    rating: 5
  }
];

const faqs = [
  {
    question: "Is HisabKitab-Pro GST compliant?",
    answer: "Yes, HisabKitab-Pro is fully GST compliant. It automatically calculates CGST, SGST, and IGST based on the transaction type and generates GST-ready invoices."
  },
  {
    question: "Can I use HisabKitab-Pro on mobile?",
    answer: "Absolutely! HisabKitab-Pro works seamlessly on Android, iOS, and Windows devices. You can access your business data from anywhere."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we use bank-grade encryption to protect your data. All data is backed up automatically to secure cloud servers."
  },
  {
    question: "Can I import my existing data?",
    answer: "Yes, you can easily import your items, parties, and opening balances using our Excel import feature."
  },
  {
    question: "Do you offer customer support?",
    answer: "We provide support via email, phone, and WhatsApp. Premium plans get priority support with faster response times."
  }
];

// Helper function to get features based on plan name
const getDefaultFeatures = (planName: string): string[] => {
  switch (planName.toLowerCase()) {
    case 'free trial':
      return ['All features included', 'Up to 2 users', 'Email support'];
    case 'silver':
      return ['Unlimited invoices', 'Full inventory management', 'Up to 3 users', 'Priority support'];
    case 'gold':
      return ['Everything in Silver', 'Up to 5 users', 'Advanced reports', 'E-Way bill integration'];
    case 'platinum':
      return ['Everything in Gold', 'Up to 10 users', 'Up to 5 businesses', 'API access'];
    case 'diamond':
      return ['Everything in Platinum', 'Up to 20 users', 'Up to 10 businesses', 'Dedicated support', '24/7 priority support'];
    default:
      return ['All features included'];
  }
};

// Helper function to format period based on duration days
const formatPeriod = (durationDays: number): string => {
  if (durationDays <= 15) return `/${durationDays} days`;
  if (durationDays <= 30) return '/month';
  if (durationDays <= 90) return '/3 months';
  if (durationDays <= 180) return '/6 months';
  return '/year';
};

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [submittingContact, setSubmittingContact] = useState(false);

  // Fetch pricing plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const { data, error } = await supabase
          .from('license_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
          console.error('Error fetching plans:', error);
          setLoadingPlans(false);
          return;
        }

        const formattedPlans: PricingPlan[] = data.map((plan: LicensePlan, index: number) => ({
          id: plan.id,
          name: plan.plan_name,
          price: `₹${plan.price.toLocaleString('en-IN')}`,
          priceValue: plan.price,
          period: formatPeriod(plan.duration_days),
          description: plan.description || '',
          features: getDefaultFeatures(plan.plan_name),
          cta: plan.price === 0 ? 'Start Free' : index === data.length - 1 ? 'Contact Sales' : 'Get Started',
          popular: index === 2 // Third plan (Platinum) is popular
        }));

        setPricingPlans(formattedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmittingContact(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim() || null,
        message: contactForm.message.trim(),
      });

      if (error) throw error;

      // Send auto-reply email to user
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "contact_auto_reply",
            to: contactForm.email.trim(),
            name: contactForm.name.trim(),
            data: { message: contactForm.message.trim() }
          },
        });
      } catch (emailError) {
        console.error("Failed to send auto-reply:", emailError);
      }

      // Notify SuperAdmin about new contact message
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "contact_form",
            data: {
              name: contactForm.name.trim(),
              email: contactForm.email.trim(),
              phone: contactForm.phone.trim() || null,
              message: contactForm.message.trim()
            }
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }

      toast.success("Thank you for contacting us! We'll get back to you soon.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      toast.error("Failed to submit: " + error.message);
    } finally {
      setSubmittingContact(false);
    }
  };

  const openWhatsApp = () => {
    const phone = "918500606000";
    const message = encodeURIComponent("Hi, I'm interested in HisabKitab-Pro. Can you help me?");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Bar */}
      <div className="py-3 md:py-4 px-4 md:px-6 text-white bg-gradient-to-r from-[hsl(32,90%,52%)] via-[hsl(142,92%,26%)] to-[hsl(32,90%,52%)] flex items-center justify-center text-center text-sm md:text-base">
        🎉 Special Offer: Use code <strong className="mx-1">HISABKITAB50</strong> for 50% off on yearly plans!
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to="/" className="flex justify-center shrink-0">
              <img
                src="/hisabkitab_dark_logo.png"
                alt="HisabKitab-Pro"
                className="h-16 md:h-24 dark:hidden"
              />
              <img
                src="/hisabkitab_light_logo.png"
                alt="HisabKitab-Pro"
                className="h-16 md:h-24 hidden dark:block"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm xl:text-base">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm xl:text-base">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm xl:text-base">Testimonials</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm xl:text-base">FAQ</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm xl:text-base">Contact</a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <TrialRequestForm 
                trigger={
                  <Button size="sm">Start Free Trial</Button>
                }
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a href="#features" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-2">Features</a>
              <a href="#pricing" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-2">Pricing</a>
              <a href="#testimonials" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-2">Testimonials</a>
              <a href="#faq" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-2">FAQ</a>
              <a href="#contact" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-2">Contact</a>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" asChild>
                  <Link to="/auth" onClick={closeMobileMenu}>Login</Link>
                </Button>
                <TrialRequestForm 
                  trigger={
                    <Button className="w-full">Start Free Trial</Button>
                  }
                />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Excise Billing Software</span>
                <br />
                for <span className="text-accent">Small Businesses</span> in India
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
                Create professional invoices, manage inventory, track payments, and grow your business with India's most trusted billing app.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Button size="lg" className="text-base md:text-lg px-6 md:px-8 bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90" asChild>
                  <Link to="/signup">
                    <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Download Now!
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 md:mt-12 grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">1 Crore+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">4.7</p>
                    <Star className="w-4 h-4 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">App Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Multi</p>
                  <p className="text-xs md:text-sm text-muted-foreground">User Support</p>
                </div>
              </div>
            </div>

            {/* Hero Video/Dashboard Preview */}
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-primary/20 via-orange-100/50 to-accent/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl md:shadow-2xl">
                <div className="relative rounded-lg md:rounded-xl overflow-hidden bg-white shadow-lg">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full rounded-lg md:rounded-xl"
                    poster="/dark_logo.png"
                  >
                    <source src="https://hisabkitab-website.vercel.app/demo-video.mp4" type="video/mp4" />
                    <img 
                      src="/dark_logo.png" 
                      alt="HisabKitab-Pro Dashboard" 
                      className="w-full rounded-lg md:rounded-xl"
                    />
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 md:w-8 md:h-8 text-primary ml-1" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements - hidden on mobile */}
              <div className="hidden md:block absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/30 to-orange-400/30 rounded-full blur-2xl" />
              <div className="hidden md:block absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-accent/30 to-green-400/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Grow Your Business</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              From billing to inventory to reports - HisabKitab-Pro has all the tools you need to run your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <CardTitle className="text-sm md:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <CardDescription className="text-xs md:text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Trusted by <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">1 Crore+ </span> Businesses
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about HisabKitab-Pro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6 p-4 md:p-6">
                  <div className="flex gap-1 mb-3 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm md:text-base">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">{testimonial.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{testimonial.business}, {testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Choose the <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Perfect Plan</span> for You
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Select a plan that fits your business needs. All plans include core billing features.
            </p>
          </div>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plans available. Please contact us for pricing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg md:scale-105' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
                    <div className="mt-3 md:mt-4">
                      <span className="text-2xl md:text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm md:text-base">{plan.period}</span>
                    </div>
                    <CardDescription className="text-xs md:text-sm">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 p-4 pt-0 md:p-6 md:pt-0">
                    <ul className="space-y-2 md:space-y-3 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-xs md:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 md:mt-6">
                      <Button 
                        className="w-full text-sm md:text-base" 
                        variant={plan.popular ? "default" : "outline"} 
                        asChild
                      >
                        <Link to={plan.id ? `/checkout?plan=${encodeURIComponent(plan.name)}` : "/signup"}>
                          {plan.cta}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  className="w-full p-4 md:p-6 text-left flex items-center justify-between gap-2"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-sm md:text-base">{faq.question}</span>
                  <ChevronDown 
                    className={`w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0">
                    <p className="text-sm md:text-base text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Get In <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Touch</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                Have questions? We're here to help. Reach out to us and we'll get back to you as soon as possible.
              </p>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Phone</p>
                    <p className="text-sm md:text-base text-muted-foreground">+91 8500 60 6000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Email</p>
                    <p className="text-sm md:text-base text-muted-foreground">support@HisabKitab-Pro.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">WhatsApp</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-green-500 hover:text-green-600 text-sm md:text-base"
                      onClick={openWhatsApp}
                    >
                      Chat with us on WhatsApp
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Address</p>
                    <p className="text-sm md:text-base text-muted-foreground">Hyderabad, India</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp & Trial CTA */}
              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                <Button 
                  size="lg" 
                  className="bg-green-500 hover:bg-green-600 text-white gap-2 text-sm md:text-base"
                  onClick={openWhatsApp}
                >
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  Chat on WhatsApp
                </Button>
                <TrialRequestForm />
              </div>
            </div>

            <Card>
              <CardContent className="p-4 md:p-6">
                <form onSubmit={handleContactSubmit} className="space-y-3 md:space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Your Message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      className="text-sm md:text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full text-sm md:text-base" disabled={submittingContact}>
                    {submittingContact ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {submittingContact ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section className="py-8 md:py-12 px-4 md:px-6 text-white bg-gradient-to-br from-[hsl(130,43%,38%)] via-[hsl(130,43%,41%)] to-[hsl(130,43%,45%)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base">
            Join 1 Crore+ businesses already using HisabKitab-Pro. Download now and start your free trial.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
            <Button size="lg" variant="secondary" className="text-sm md:text-lg">
              <Smartphone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Android App
            </Button>
            <Button size="lg" variant="secondary" className="text-sm md:text-lg">
              <Smartphone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              iOS App
            </Button>
            <Button size="lg" variant="secondary" className="text-sm md:text-lg">
              <Monitor className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Windows App
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-[#1a3324] text-white">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-green-600 via-green-500 to-green-600" />

        {/* Slanted dotted lines */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div
            className="absolute w-[130%] border-t border-dashed border-white/25"
            style={{ top: "38%", left: "-15%", transform: "rotate(-6deg)" }}
          />
          <div
            className="absolute w-[130%] border-t border-dashed border-white/20"
            style={{ top: "70%", left: "-15%", transform: "rotate(-6deg)" }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            {/* Logo and Description */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-0 leading-none">
                <img
                  src="/hisabkitab_light_logo.png"
                  alt="HisabKitab-Pro"
                  className="h-16 md:h-24 object-contain"
                />
              </div>

              <p className="text-white/70 text-xs md:text-sm mb-4">
                India's #1 Excise Billing & Accounting Software for Small Businesses.
              </p>

              <div className="space-y-2 text-xs md:text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  <span className="break-all">support@hisabkitab.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  <span>+91 77029 60 600</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  <span>Hyderabad, India</span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-white text-sm md:text-base">Product</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-white text-sm md:text-base">Company</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-white text-sm md:text-base">Support</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="flex items-center gap-3 bg-[#1a3324] px-4">
                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-green-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-green-500"></div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/90 text-center md:text-left">
              © {new Date().getFullYear()} HisabKitab-Pro. All rights reserved. • Created by{" "}
              <a
                href="https://dexorzo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/70 hover:text-white underline-offset-4 hover:underline"
              >
                Dexorzo Creations
              </a>
            </p>
            <div className="flex items-center gap-2 md:gap-4">
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
