'use client';

import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackEmoji?: string;
  fallbackText?: string;
  fallbackBg?: string;
  style?: React.CSSProperties;
}

export default function SafeImage({
  src,
  alt,
  className = '',
  fallbackEmoji = '🎨',
  fallbackText = '',
  fallbackBg = 'bg-gray-100',
  style,
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center ${fallbackBg} ${className}`}
        style={style}
      >
        <div className="text-center p-2">
          <div className="text-3xl">{fallbackEmoji}</div>
          {fallbackText && (
            <p className="text-[10px] text-gray-400 mt-1 max-w-[80px] mx-auto leading-tight">
              {fallbackText}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
