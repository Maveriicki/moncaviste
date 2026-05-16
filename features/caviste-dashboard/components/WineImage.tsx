interface WineImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function WineImage({ src, alt, className = '' }: WineImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#201015,#7B1D2E_55%,#D9B96F)] text-xs font-semibold uppercase tracking-[0.22em] text-white/80 ${className}`}
    >
      Vin
    </div>
  )
}
