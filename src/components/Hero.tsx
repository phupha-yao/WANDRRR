import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/blue-hero.png";
interface HeroProps {
  isAuthenticated: boolean;
}
export const Hero = ({
  isAuthenticated
}: HeroProps) => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      // Scroll to form
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-ocean bg-clip-text text-transparent">​WANDR
          </span>
            <br />
            <span className="text-foreground">
              into perfect plans
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-[1250px]">Upload your screenshots. Get a personalised itinerary with everything you want.</p>

          <div className="flex justify-center items-center pt-8 mt-[200px]">
            <Button size="lg" onClick={handleGetStarted} className="group text-lg px-8 py-6 bg-gradient-ocean hover:shadow-glow transition-all duration-300 hover:scale-105">
              <Upload className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Get Started
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center pt-8">
            {["AI-Powered Analysis", "Live Weather", "Smart Routing", "Photo Recognition"].map(feature => <div key={feature} className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border text-sm font-medium shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
                {feature}
              </div>)}
          </div>
        </div>
      </div>

      {/* Gradient Orbs for Visual Interest */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{
      animationDelay: '1s'
    }} />
    </section>;
};