// The API stores each uploaded picture as WebP in three widths: name-480.webp, name-960.webp and name.webp (up to 1920).
// The browser then downloads only the size the screen needs. Older pictures (jpg/png) have one size and are left as they are.
const smaller = [480, 960]

export function responsiveImage(url: string, sizes: string): { src: string; srcSet?: string; sizes?: string } {
  if (!url.endsWith('.webp')) return { src: url }
  const base = url.slice(0, -'.webp'.length)
  return { src: url, srcSet: [...smaller.map((width) => `${base}-${width}.webp ${width}w`), `${url} 1920w`].join(', '), sizes }
}

// Thumbnails (cart lines, order rows) are always the smallest copy.
export function thumbnail(url: string): string {
  return url.endsWith('.webp') ? `${url.slice(0, -'.webp'.length)}-480.webp` : url
}
