import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryData } from "./ItineraryDisplay";

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  itinerary: ItineraryData;
  created_at: string;
}

interface PastTripsProps {
  onSelectTrip: (itinerary: ItineraryData) => void;
}

export const PastTrips = ({ onSelectTrip }: PastTripsProps) => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "Failed to load past trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8 text-center text-muted-foreground">
          No past trips yet. Create your first itinerary above!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold">Your Past Trips</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {trip.destination}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectTrip(trip.itinerary)}
                variant="outline"
                className="w-full"
              >
                View Itinerary
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
