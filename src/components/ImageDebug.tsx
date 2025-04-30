import React from 'react';

interface ImageDebugProps {
  hasImage: boolean;
  imageUrl: string | null;
  title: string;
}

const ImageDebug: React.FC<ImageDebugProps> = ({ hasImage, imageUrl, title }) => {
  return (
    <div className="border border-red-500 p-4 rounded-md mt-2 mb-4 bg-red-50 text-red-700">
      <h3 className="font-bold mb-2">Image Debug Info</h3>
      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32">
        {JSON.stringify({
          hasImage,
          imageUrl,
          title,
          time: new Date().toISOString(),
        }, null, 2)}
      </pre>
    </div>
  );
};

export default ImageDebug; 