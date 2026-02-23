import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Calendar, Wallet, MessageSquare, Trophy, Target, ArrowRight, Star, Users, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const painPoints = [
    {
      icon: Calendar,
      title: "Scheduling Chaos",
      description: "Coaches juggle calls, chat apps, and spreadsheets—resulting in double bookings and last-minute cancellations.",
      quote: "Through calls and texts... multiple clients want the same schedule.",
      author: "Coach Aging"
    },
    {
      icon: Wallet,
      title: "Payment Headaches",
      description: "Cash and GCash payments get missed, delayed, or stolen. No deposits mean constant no-shows.",
      quote: "When they don't pay, I lose money because I also have assistant coaches.",
      author: "Coach Andrew"
    },
    {
      icon: MessageSquare,
      title: "Broken Communication",
      description: "Miscommunication and schedule clashes damage relationships and waste your valuable time.",
      quote: "Cancellations from miscommunication... Schedule clashes...",
      author: "Coach Pancho"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card backdrop-blur-xl shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl">
                <Calendar className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">MatchUp</h1>
                <p className="text-xs text-muted-foreground">For Sports Coaches</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="border-2 border-primary/30 hover:bg-primary hover:text-foreground transition-all"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 bg-background">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
          <div className="absolute top-1/4 right-0 w-1 h-64 bg-secondary"></div>
        </div>
        
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-secondary bg-card px-5 py-2 text-sm font-semibold text-foreground backdrop-blur-sm shadow-lg">
              <Sparkles className="h-4 w-4 text-secondary" />
              Built for Coaches • AI-Powered Assistant
            </div>
            
            <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Stop chasing payments.
              <br />
              <span className="text-secondary">
                Start coaching smarter.
              </span>
            </h1>
            
            <p className="mb-10 text-xl text-muted-foreground md:text-2xl font-light leading-relaxed">
              Smart calendar + AI assistant for GCash, Maya, and cash payments.
              <br />
              <span className="font-medium text-foreground">Everything in one place. No more SMS. No more spreadsheets.</span>
            </p>
            
            <div className="flex flex-col gap-5 sm:flex-row sm:justify-center">
              <Button 
                size="lg" 
                className="h-16 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all bg-secondary text-secondary-foreground hover:bg-secondary-hover luxury-glow"
                onClick={() => navigate("/auth")}
              >
                Try Premium for a Week for Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <Shield className="h-5 w-5 text-success" />
                <span className="font-medium text-foreground">100% Secure</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <MessageSquare className="h-5 w-5 text-secondary" />
                <span className="font-medium text-foreground">AI Assistant Included</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Trusted by Filipino Coaches</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative bg-card py-24 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
              Coaches lose 10+ hours weekly
              <br />
              <span className="text-primary font-light">chasing schedules and payments</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              50% of Metro Manila coaches spend more time on admin than actual coaching
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <Card key={index} className="group relative overflow-hidden border-2 border-border p-8 transition-all duration-500 hover:border-secondary hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-2 bg-background">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-secondary opacity-5 rounded-full blur-3xl transition-all duration-500 group-hover:opacity-15" />
                  <div className="relative">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-lg border-2 border-secondary/30">
                      <Icon className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-foreground">{point.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{point.description}</p>
                    <blockquote className="border-l-4 border-primary pl-4 text-sm italic text-muted-foreground">
                      "{point.quote}" — {point.author}
                    </blockquote>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Section with AI */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
              Built for <span className="text-primary">Modern Coaches</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Every feature designed for seamless payments, smart scheduling, and professional coaching
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="group flex gap-6 p-6 rounded-2xl transition-all bg-card border-2 border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/10">
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg group-hover:scale-110 transition-transform border-2 border-secondary/30">
                    <CheckCircle2 className="h-7 w-7 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground">Smart Calendar</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    One calendar for everything. Athletes book through your link—goodbye chat apps and spreadsheets.
                  </p>
                </div>
              </div>

              <div className="group flex gap-6 p-6 rounded-2xl transition-all bg-card border-2 border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/10">
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg group-hover:scale-110 transition-transform border-2 border-secondary/30">
                    <Wallet className="h-7 w-7 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground">Payment Tracking</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track all payments seamlessly with GCash, Maya, or cash—complete transparency for every session.
                  </p>
                </div>
              </div>

              <div className="group flex gap-6 p-6 rounded-2xl bg-card border-2 border-primary transition-all hover:shadow-2xl">
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-7 w-7 text-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground flex items-center gap-2">
                    AI Assistant
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">NEW</span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Athletes can chat with AI 24/7 for booking questions, payment status, and schedules—no more SMS reminders needed!
                  </p>
                </div>
              </div>

              <div className="group flex gap-6 p-6 rounded-2xl transition-all bg-card border-2 border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/10">
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent shadow-lg group-hover:scale-110 transition-transform border-2 border-secondary/30">
                    <Trophy className="h-7 w-7 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground">Built for PH Payments</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    GCash and Maya integration plus cash workflow tracking. Works exactly how Filipinos pay.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="flex items-center justify-center">
              <Card className="relative w-full max-w-md overflow-hidden border-2 border-secondary bg-card p-10 shadow-2xl shadow-secondary/10">
                <div className="absolute top-0 right-0 w-2 h-full bg-secondary"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-secondary"></div>
                
                <div className="relative">
                  <div className="mb-8 text-center">
                    <div className="mb-3 inline-block rounded-full bg-secondary px-4 py-1 text-sm font-semibold text-secondary-foreground shadow-lg">
                      Premium + AI
                    </div>
                    <div className="mb-2 flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-extrabold text-secondary">₱399</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">No hidden fees, no surprises</p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">Unlimited bookings</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">GCash & Maya integration</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">24/7 AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">Custom booking policies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">Automatic payment tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground">Priority support (Tagalog)</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg font-semibold shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:shadow-xl transition-all" 
                    size="lg" 
                    onClick={() => navigate("/auth")}
                  >
                    Try Premium for a Week for Free
                  </Button>
                  
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Or use the <span className="font-semibold text-foreground">freemium tier</span> forever
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-primary py-24 border-y-4 border-secondary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-card rounded-full blur-3xl"></div>
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-extrabold text-foreground md:text-5xl">
            Join Filipino Coaches Taking Control
          </h2>
          <p className="mb-10 text-xl text-muted-foreground font-light leading-relaxed">
            Basketball, Tennis, Golf, Badminton, and S&C coaches save 10+ hours weekly with MatchUp
          </p>
          <Button 
            size="lg" 
            className="h-16 px-10 text-lg font-semibold bg-secondary text-secondary-foreground shadow-xl hover:bg-secondary-hover hover:shadow-2xl hover:scale-105 transition-all luxury-glow"
            onClick={() => navigate("/auth")}
          >
            Try Premium for a Week for Free
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg">
                  <Calendar className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">MatchUp</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Built by coaches, for coaches
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-secondary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-secondary transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-secondary transition-colors">Sign In</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>matchup.ph@gmail.com</li>
                <li>Metro Manila, Philippines</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 MatchUp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
