export function handleImageError(event: Event, fallbackSvg?: string): void {
  const img = event.target as HTMLImageElement;
  if (fallbackSvg) {
    img.src = fallbackSvg;
  } else {
    img.style.display = 'none';
  }
}

export const DEFAULT_LOGO_SVG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="%232E7D32"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="16">S</text></svg>';
