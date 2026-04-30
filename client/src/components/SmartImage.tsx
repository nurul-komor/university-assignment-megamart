import { useState } from "react";

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "https://via.placeholder.com/800x500?text=Image+Unavailable";

export function SmartImage({ src, alt, className = "", fallbackSrc = DEFAULT_FALLBACK }: SmartImageProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {loading && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <img
        src={failed ? fallbackSrc : src || fallbackSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setFailed(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
