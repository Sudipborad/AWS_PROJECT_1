import React, { useState, useEffect } from 'react';
import { FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackHeight?: string;
  fallbackMessage?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className,
  fallbackHeight = "16rem",
  fallbackMessage = "Image could not be loaded",
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state if src changes
    setError(false);
    setLoaded(false);
    setImageData(null);
    
    // If src is null or empty, immediately set error
    if (!src) {
      console.log('[SafeImage] No src provided, showing fallback');
      setError(true);
      return;
    }
    
    // Try to load the image
    const img = new Image();
    img.onload = () => {
      setImageData(src);
      setLoaded(true);
    };
    img.onerror = () => {
      console.error(`[SafeImage] Failed to load image: ${src}`);
      setError(true);
    };
    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  if (error || !src) {
    return (
      <div 
        className={cn(
          "rounded-md border p-4 bg-muted flex flex-col items-center justify-center",
          className
        )}
        style={{ height: fallbackHeight }}
      >
        <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{fallbackMessage}</p>
        {src && (
          <p className="text-xs text-muted-foreground mt-1 max-w-full truncate">
            Failed to load: {src}
          </p>
        )}
      </div>
    );
  }
  
  if (!loaded) {
    return (
      <div 
        className={cn(
          "rounded-md border p-4 bg-muted flex flex-col items-center justify-center",
          className
        )}
        style={{ height: fallbackHeight }}
      >
        <div className="h-8 w-8 rounded-full border-4 border-t-primary animate-spin"/>
        <p className="text-sm text-muted-foreground mt-2">Loading image...</p>
      </div>
    );
  }
  
  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <img
        src={imageData || ""}
        alt={alt || "Image"}
        className="w-full h-full object-contain"
        {...props}
      />
    </div>
  );
};

export default SafeImage; 