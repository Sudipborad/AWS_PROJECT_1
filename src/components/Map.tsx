import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Locate } from 'lucide-react';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon issue with a workaround
const DefaultIcon = new L.Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Ensure the default marker icon is set
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  onLocationSelect?: (coords: {lat: number, lng: number}) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  markerPositions?: Array<{lat: number, lng: number, title?: string}>;
  interactive?: boolean;
}

// Helper component for map events
const MapEvents = ({ onLocationSelect }: { onLocationSelect?: (coords: {lat: number, lng: number}) => void }) => {
  const map = useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    },
  });
  return null;
};

// Helper component to set view
const SetViewOnLoad = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Helper component to add the locate control
const LocationButton = () => {
  const map = useMap();
  const { toast } = useToast();
  
  const handleGetLocation = () => {
    toast({
      title: "Finding your location...",
      description: "Please allow location access if prompted.",
    });
    
    map.locate({
      setView: true,
      maxZoom: 16
    });
    
    map.on('locationfound', (e) => {
      toast({
        title: "Location found",
        description: "Map has been centered on your current location.",
      });
    });
    
    map.on('locationerror', (e) => {
      toast({
        title: "Location error",
        description: "Unable to find your location. Please check your device settings.",
        variant: "destructive"
      });
    });
  };
  
  return (
    <div className="leaflet-bottom leaflet-right z-[1000]" style={{ marginBottom: "20px", marginRight: "10px" }}>
      <Button 
        onClick={handleGetLocation}
        size="sm"
        className="flex items-center gap-1 shadow-md"
      >
        <Locate className="h-4 w-4" />
        <span>My Location</span>
      </Button>
    </div>
  );
};

const Map: React.FC<MapProps> = ({
  onLocationSelect,
  initialCenter = [40, -74.5],
  initialZoom = 9,
  markerPositions = [],
  interactive = true
}) => {
  const { toast } = useToast();
  const [markers, setMarkers] = useState<Array<{lat: number, lng: number, title?: string}>>(markerPositions);
  const mapRef = useRef(null);
  const locationFetchedRef = useRef(false);

  useEffect(() => {
    // Update markers when markerPositions prop changes
    setMarkers(markerPositions);
  }, [markerPositions]);

  // Handle location selection and add marker
  const handleLocationSelect = (coords: {lat: number, lng: number}) => {
    if (onLocationSelect) {
      // Call the parent component's handler
      onLocationSelect(coords);
      
      // Only update markers if needed and there are no external markers
      if (markerPositions.length === 0) {
        setMarkers([{ ...coords }]);
      }
    }
  };

  // Get user's location on component mount if available
  useEffect(() => {
    const getLocation = () => {
      if (interactive && onLocationSelect && navigator.geolocation && !locationFetchedRef.current) {
        locationFetchedRef.current = true; // Set the flag to prevent multiple fetches
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Only set initial location if we don't have markers yet
            if (markers.length === 0 && markerPositions.length === 0) {
              // Call onLocationSelect with the user's coordinates
              onLocationSelect({
                lat: latitude,
                lng: longitude
              });
              
              toast({
                title: "Location found",
                description: "Using your current location",
              });
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            // Don't show error toast as the user can still select location manually
          }
        );
      }
    };
    
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to ensure it only runs once on mount

  // Force re-render if map container is missing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        console.log("Map container is ready");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={mapRef} className="relative w-full h-[400px] rounded-md overflow-hidden">
      {typeof window !== 'undefined' && (
        <MapContainer 
          center={initialCenter} 
          zoom={initialZoom} 
          scrollWheelZoom={interactive}
          dragging={interactive}
          zoomControl={interactive}
          touchZoom={interactive}
          doubleClickZoom={interactive}
          style={{ height: '100%', width: '100%' }}
          key="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SetViewOnLoad center={initialCenter} zoom={initialZoom} />
          
          {/* Only add click events if interactive and onLocationSelect provided */}
          {interactive && onLocationSelect && (
            <MapEvents onLocationSelect={handleLocationSelect} />
          )}
          
          {/* Display all markers */}
          {markers.map((position, idx) => (
            <Marker 
              key={`marker-${idx}-${position.lat}-${position.lng}`} 
              position={[position.lat, position.lng]}
              icon={DefaultIcon}
            >
              {position.title && (
                <Popup>
                  <div>{position.title}</div>
                </Popup>
              )}
            </Marker>
          ))}
          
          {/* Add location control if interactive */}
          {interactive && <LocationButton />}
        </MapContainer>
      )}
    </div>
  );
};

export default Map;
