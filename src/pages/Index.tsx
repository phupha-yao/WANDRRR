import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { Hero } from "@/components/Hero";
import { PlannerForm, PlannerFormData } from "@/components/PlannerForm";
import { ItineraryDisplay, ItineraryData } from "@/components/ItineraryDisplay";
import { PastTrips } from "@/components/PastTrips";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFormSubmit = async (formData: PlannerFormData) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert screenshots to base64 for AI processing
      const screenshotPromises = formData.screenshots.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const screenshots = await Promise.all(screenshotPromises);

      // Call edge function to generate itinerary
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
          interests: formData.interests,
          screenshots,
          additionalNotes: formData.additionalNotes,
          allowAISuggestions: formData.allowAISuggestions,
        }
      });

      if (error) throw error;

      // Save trip to database
      const { error: saveError } = await (supabase as any)
        .from('trips')
        .insert({
          user_id: user.id,
          destination: formData.location,
          start_date: formData.startDate,
          end_date: formData.endDate,
          interests: formData.interests,
          itinerary: data,
        });

      if (saveError) throw saveError;

      setItinerary(data);
      toast({
        title: "Itinerary created!",
        description: "Your personalized day plan is ready.",
      });

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrip = (tripItinerary: ItineraryData) => {
    setItinerary(tripItinerary);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Sign Out */}
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}

      <Hero isAuthenticated={!!user} />
      
      {user && (
        <>
          <section className="container mx-auto px-4 py-20">
            <PlannerForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </section>

          <section className="container mx-auto px-4 py-20">
            <PastTrips onSelectTrip={handleSelectTrip} />
          </section>
        </>
      )}

      {itinerary && (
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <ItineraryDisplay itinerary={itinerary} />
        </section>
      )}
    </div>
  );
};

export default Index;
