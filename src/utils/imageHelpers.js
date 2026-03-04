// frontend/src/utils/imageHelpers.js

/**
 * Handle image loading errors with fallback options
 */
export const handleImageError = (e, fallbackType = 'hide') => {
  const img = e.target;
  
  switch (fallbackType) {
    case 'hide':
      img.style.display = 'none';
      break;
      
    case 'placeholder':
      // Use a local placeholder instead of external service
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjI4IiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4/PC90ZXh0Pgo8L3N2Zz4K';
      break;
      
    case 'initials':
      // Create avatar with initials
      const parent = img.parentElement;
      const name = img.alt || 'U';
      const initials = name.charAt(0).toUpperCase();
      
      parent.innerHTML = `
        <div style="
          width: 56px;
          height: 56px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-weight: bold;
          font-size: 20px;
        ">${initials}</div>
      `;
      break;
      
    default:
      img.style.display = 'none';
  }
};

/**
 * Validate image URL before setting
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get safe image URL with fallback
 */
export const getSafeImageUrl = (url, fallback = null) => {
  if (isValidImageUrl(url)) {
    return url;
  }
  return fallback || null;
};

/**
 * Build a Google Static Maps URL for the given markers/center
 * - markers: [{ lat, lng } | { query } | 'address string']
 * - center: { lat, lng } | 'address string'
 */
export const getStaticMapUrl = ({ markers = [], center, zoom = 15, size = '800x400', mapType = 'roadmap', scale = 2, apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY } = {}) => {
  if (!apiKey) return null;

  const params = new URLSearchParams();
  params.set('size', size);
  params.set('scale', String(scale));
  params.set('maptype', mapType);
  if (zoom) params.set('zoom', String(zoom));

  // markers may be address strings or lat,lng objects
  (markers || []).forEach((m) => {
    if (m == null) return;
    if (typeof m === 'string') {
      params.append('markers', m);
      return;
    }
    if (m.lat != null && m.lng != null) {
      params.append('markers', `${m.lat},${m.lng}`);
      return;
    }
    if (m.query) {
      params.append('markers', m.query);
      return;
    }
  });

  if (center) {
    if (typeof center === 'string') params.set('center', center);
    else if (center.lat != null && center.lng != null) params.set('center', `${center.lat},${center.lng}`);
  }

  params.set('key', apiKey);
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};

/**
 * Fetch a static-map image and trigger download (uses the Static Maps API)
 */
export const downloadStaticMap = async ({ markers = [], center, zoom = 15, size = '1200x800', filename = 'map.png' } = {}) => {
  const url = getStaticMapUrl({ markers, center, zoom, size });
  if (!url) throw new Error('Missing Google Maps API key');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch static map');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
};