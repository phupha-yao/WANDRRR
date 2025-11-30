import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, MapPin, Calendar, Heart, Sparkles, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlannerFormProps {
  onSubmit: (data: PlannerFormData) => void;
  isLoading?: boolean;
}

export interface PlannerFormData {
  location: string;
  startDate: string;
  endDate: string;
  interests: string[];
  screenshots: File[];
  additionalNotes: string;
  allowAISuggestions: boolean;
}

const INTEREST_OPTIONS = [
  "Art & Museums",
  "Food & Dining",
  "Music & Nightlife",
  "Shopping",
  "Nature & Parks",
  "Sports & Fitness",
  "Cultural Events",
  "History",
  "Photography",
  "Adventure Activities"
];

export const PlannerForm = ({ onSubmit, isLoading }: PlannerFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlannerFormData>({
    location: "",
    startDate: "",
    endDate: "",
    interests: [],
    screenshots: [],
    additionalNotes: "",
    allowAISuggestions: true,
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + formData.screenshots.length > 20) {
      toast({
        title: "Too many files",
        description: "You can upload up to 20 screenshots",
        variant: "destructive"
      });
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, ...files]
    }));
  };

  const handleRemoveScreenshot = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in location and dates",
        variant: "destructive"
      });
      return;
    }

    if (formData.screenshots.length === 0) {
      toast({
        title: "No screenshots",
        description: "Please upload at least one screenshot",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Location & Dates */}
      <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6 text-primary" />
            Where & When
          </CardTitle>
          <CardDescription>Tell us about your trip destination and dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Destination</Label>
            <Input
              id="location"
              placeholder="e.g., Barcelona, Spain"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="text-lg"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-accent" />
            Your Interests
          </CardTitle>
          <CardDescription>Select all that apply to personalize your itinerary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => (
              <Badge
                key={interest}
                variant={formData.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Upload */}
      <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Upload className="h-6 w-6 text-secondary" />
            Upload Screenshots
          </CardTitle>
          <CardDescription>Add screenshots of events, places, or activities you want to include</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="screenshots"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="screenshots"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB each (max 20 files)
              </p>
            </label>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Additional Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific preferences or requirements..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              className="min-h-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aiSuggestions"
              checked={formData.allowAISuggestions}
              onChange={(e) => setFormData(prev => ({ ...prev, allowAISuggestions: e.target.checked }))}
              className="h-4 w-4"
            />
            <Label htmlFor="aiSuggestions" className="cursor-pointer">
              Allow AI to suggest additional activities based on your interests
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="px-12 py-6 text-lg bg-gradient-ocean hover:shadow-glow transition-all duration-300 hover:scale-105"
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              Creating Your Perfect Day...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Itinerary
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
