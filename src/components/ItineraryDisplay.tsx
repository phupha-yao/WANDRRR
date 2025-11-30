import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Cloud, Navigation, Share2, Download } from "lucide-react";

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  category: string;
  duration: string;
  weather?: string;
  travelTime?: string;
  imageUrl?: string;
}

export interface ItineraryData {
  date: string;
  items: ItineraryItem[];
  summary: string;
}

interface ItineraryDisplayProps {
  itinerary: ItineraryData;
}

export const ItineraryDisplay = ({ itinerary }: ItineraryDisplayProps) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
          Your Perfect Day
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {itinerary.summary}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-twilight" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {itinerary.items.map((item, index) => (
            <Card key={item.id} className="ml-16 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02]">
              {/* Timeline Dot */}
              <div className="absolute left-6 mt-8 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-glow" />

              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">{item.time}</span>
                      <Badge variant="secondary" className="ml-2">
                        {item.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                  
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">{item.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {item.weather && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Cloud className="h-4 w-4" />
                      <span>{item.weather}</span>
                    </div>
                  )}
                  {item.travelTime && index > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="h-4 w-4" />
                      <span>{item.travelTime} from previous location</span>
                    </div>
                  )}
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
