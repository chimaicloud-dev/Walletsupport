import { Link } from "wouter";
import { MessageSquare, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import PublicLayout from "@/components/public-layout";

export default function LandingPage() {
  return (
    <PublicLayout>
      <div className="flex-1 bg-background relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              A personal inbox for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                your people.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Set up a beautiful, shareable support link in seconds. 
              Manage conversations calmly, professionally, and on your own terms.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/sign-up" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Claim your link
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            
            <div className="pt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Free to start. No credit card required.</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 py-24 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">One Clean Inbox</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stop losing messages in DMs and emails. Bring all your audience interactions into a single, organized dashboard.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Setup in Seconds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pick a handle, write a short bio, and you're live. Share your link anywhere you connect with your audience.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Build Relationships</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Reply thoughtfully without the pressure of instant messaging. Treat your audience like humans, not tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}