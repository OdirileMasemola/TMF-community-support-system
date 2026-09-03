type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string; 
  priority?: boolean;
  width?: number;
  height?: number;
};

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
