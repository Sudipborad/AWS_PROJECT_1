import React, { useState, useEffect } from 'react';
import { FileImage } from 'lucide-react';

interface ComplaintImageProps {
  imageUrl: string | null;
  title: string;
  className?: string;
  height?: string;
}

const ComplaintImage: React.FC<ComplaintImageProps> = ({
  imageUrl,
  title,
  className = '',
  height = '16rem'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      setError(true);
      return;
    }

    // Reset states when imageUrl changes
    setLoading(true);
    setError(false);
    setImageData(null);

    // Try to load the image
    const img = new Image();
    img.onload = () => {
      setImageData(imageUrl);
      setLoading(false);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${imageUrl}`);
      setError(true);
      setLoading(false);
    };
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Display loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`} style={{ height }}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  // Display error state with SVG placeholder
  if (error || !imageData) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-md p-4 ${className}`} style={{ height }}>
        <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          {imageUrl ? 'Failed to load image' : 'No image available'}
        </p>
        {imageUrl && (
          <p className="text-xs text-muted-foreground mt-2 max-w-full truncate">
            {imageUrl}
          </p>
        )}
      </div>
    );
  }

  // Display the actual image
  return (
    <div className={`rounded-md border overflow-hidden ${className}`}>
      <img 
        src={imageData} 
        alt={`Image for ${title}`}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ComplaintImage; 