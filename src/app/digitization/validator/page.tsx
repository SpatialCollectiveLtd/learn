import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";

export default function ValidatorTrainingPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundBeams className="opacity-20" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="text-primary text-2xl font-bold">SC</div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-foreground">
                    Spatial Collective
                  </h1>
                  <p className="text-xs text-foreground-subtle">Validator Training</p>
                </div>
              </Link>
              
              <Link 
                href="/digitization"
                className="flex items-center gap-2 text-foreground-subtle hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Back to Roles</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl mb-8">✓</div>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-foreground mb-6">
              Validator Training
            </h2>
            <div className="bg-background-card border border-primary/30 rounded-2xl p-8 mb-8">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-lg text-foreground-muted mb-4">
                This training module is currently being developed and will be available soon.
              </p>
              <p className="text-foreground-subtle">
                Complete the Mapper training first, then check back here for validator-specific 
                content on quality assurance, validation workflows, and best practices.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/digitization/mapper"
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-subheading font-semibold transition-colors"
              >
                Go to Mapper Training
              </Link>
              <Link 
                href="/digitization"
                className="px-6 py-3 bg-background-elevated border border-border hover:border-primary text-foreground rounded-lg font-subheading font-semibold transition-colors"
              >
                Back to Roles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
