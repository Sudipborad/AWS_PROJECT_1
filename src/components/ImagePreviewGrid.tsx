import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImagePreviewGridProps {
  images: string[];
  onRemove: (index: number) => void;
  className?: string;
}

const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({
  images,
  onRemove,
  className = ''
}) => {
  if (images.length === 0) {
    return null;
  }
  
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 ${className}`}>
      {images.map((src, index) => (
        <div key={index} className="relative group rounded-md overflow-hidden border">
          <img 
            src={src} 
            alt={`Preview ${index + 1}`} 
            className="w-full h-24 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImagePreviewGrid; 