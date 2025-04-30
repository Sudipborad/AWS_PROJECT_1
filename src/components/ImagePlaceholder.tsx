import React from 'react';
import { FileImage } from 'lucide-react';

interface ImagePlaceholderProps {
  height?: string;
  title?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ 
  height = "16rem", 
  title = "Image is not available" 
}) => {
  return (
    <div 
      className="rounded-md border p-4 bg-muted flex flex-col items-center justify-center"
      style={{ height }}
    >
      <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

export default ImagePlaceholder; 