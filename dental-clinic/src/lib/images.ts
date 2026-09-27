/**
 * Curated dental-clinic imagery.
 * All images are served from Unsplash's CDN (images.unsplash.com).
 * Swap any URL here to rebrand — components reference these constants only.
 */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`

export const IMAGES = {
  hero: u('photo-1629909613654-28e377c37b09'),
  heroSecondary: u('photo-1588776814546-1ffcf47267a5', 900),
  about: u('photo-1606811841689-23dfddce3e95'),
  aboutDetail: u('photo-1598256989800-fe5f95da9787', 800),
  reception: u('photo-1629909615184-74f495363b67', 1200),
  team: u('photo-1571772996211-2f02c9727629', 1200),
  bookingAccent: u('photo-1609840114035-3c981b782dfe', 1000),
} as const

/**
 * Service imagery keyed by a slug derived from the service name.
 * Lookup falls back to `default` when no specific image matches.
 */
export const SERVICE_IMAGES: Record<string, string> = {
  'dental-checkup': u('photo-1588776814546-1ffcf47267a5', 900),
  'professional-teeth-cleaning': u('photo-1606811841689-23dfddce3e95', 900),
  'teeth-cleaning': u('photo-1606811841689-23dfddce3e95', 900),
  'teeth-whitening': u('photo-1609840114035-3c981b782dfe', 900),
  'tooth-filling': u('photo-1598256989800-fe5f95da9787', 900),
  'emergency-consultation': u('photo-1629909615184-74f495363b67', 900),
  'cosmetic-smile-consultation': u('photo-1629909613654-28e377c37b09', 900),
  default: u('photo-1571772996211-2f02c9727629', 900),
}

export function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function serviceImage(name: string): string {
  const slug = slugifyServiceName(name)
  // Try progressively shorter prefixes so "Professional Teeth Cleaning"
  // still matches a "teeth-cleaning" key.
  const parts = slug.split('-')
  for (let len = parts.length; len > 0; len--) {
    const candidate = parts.slice(parts.length - len).join('-')
    if (SERVICE_IMAGES[candidate]) return SERVICE_IMAGES[candidate]
    const prefix = parts.slice(0, len).join('-')
    if (SERVICE_IMAGES[prefix]) return SERVICE_IMAGES[prefix]
  }
  return SERVICE_IMAGES.default
}
