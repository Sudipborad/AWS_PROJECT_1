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
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Finding your location...",
      description: "Please allow location access if prompted.",
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 16);
        toast({
          title: "Location found",
          description: "Map has been centered on your current location.",
        });
      },
      (error) => {
        let errorMessage = "Unable to find your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please check your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
  initialCenter = [20.5937, 78.9629], // Center of India
  initialZoom = 5,
  markerPositions = [],
  interactive = true
}) => {
  const { toast } = useToast();
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [markers, setMarkers] = useState<Array<{lat: number, lng: number, title?: string}>>(markerPositions);
  const mapRef = useRef(null);

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

  // Get user's location on component mount
  useEffect(() => {
    if (interactive && onLocationSelect && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update center and zoom
          setCenter([latitude, longitude]);
          
          // Only set location if we don't have markers yet
          if (markers.length === 0 && markerPositions.length === 0) {
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
          let errorMessage = "Unable to find your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied. Please check your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          toast({
            title: "Location error",
            description: errorMessage,
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [interactive, onLocationSelect, markers.length, markerPositions.length, toast]);

  return (
    <div ref={mapRef} className="relative w-full h-[400px] rounded-md overflow-hidden">
      {typeof window !== 'undefined' && (
        <MapContainer 
          center={center} 
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
          <SetViewOnLoad center={center} zoom={initialZoom} />
          
          {/* Only add click events if interactive and onLocationSelect provided */}
          {interactive && onLocationSelect && (
            <MapEvents onLocationSelect={handleLocationSelect} />
          )}
          
          {/* Add location button if interactive */}
          {interactive && <LocationButton />}
          
          {/* Display markers */}
          {markers.map((marker, index) => (
            <Marker 
              key={`${marker.lat}-${marker.lng}-${index}`}
              position={[marker.lat, marker.lng]}
            >
              {marker.title && (
                <Popup>
                  {marker.title}
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default Map;
