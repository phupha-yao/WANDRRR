import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ItineraryItem } from './ItineraryDisplay';

interface RouteMapProps {
  items: ItineraryItem[];
}

export const RouteMap = ({ items }: RouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Get the Mapbox token from environment
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (token) {
      setMapboxToken(token);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [115.188919, -8.409518], // Default to Bali center
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add traffic layer when style loads
    map.current.on('load', () => {
      if (map.current) {
        map.current.addSource('mapbox-traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        });
        
        map.current.addLayer({
          id: 'traffic',
          type: 'line',
          source: 'mapbox-traffic',
          'source-layer': 'traffic',
          paint: {
            'line-width': 3,
            'line-color': [
              'case',
              ['==', ['get', 'congestion'], 'low'], '#10b981',
              ['==', ['get', 'congestion'], 'moderate'], '#f59e0b',
              ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
              ['==', ['get', 'congestion'], 'severe'], '#7f1d1d',
              '#3b82f6'
            ]
          }
        });
      }
    });

    // Add markers for each location
    const bounds = new mapboxgl.LngLatBounds();

    items.forEach((item, index) => {
      // Create a simple marker (you can enhance this with geocoding API)
      const marker = new mapboxgl.Marker({
        color: index === 0 ? '#10b981' : index === items.length - 1 ? '#ef4444' : '#3b82f6'
      })
        .setLngLat([115.188919 + (index * 0.05), -8.409518 - (index * 0.03)]) // Mock coordinates
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${item.time} - ${item.title}</h3>
                <p class="text-sm text-muted-foreground">${item.location}</p>
              </div>
            `)
        )
        .addTo(map.current!);

      bounds.extend([115.188919 + (index * 0.05), -8.409518 - (index * 0.03)]);
    });

    // Fit map to show all markers
    if (items.length > 0) {
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, items]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
