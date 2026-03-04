import { useEffect, useRef } from 'react';

// Lightweight Google Maps loader + React wrapper
// Usage examples:
// <GoogleMap query="Eiffel Tower, Paris" height="220px" />
// <GoogleMap markers={[{ query: 'Statue of Liberty, NY', title: 'Statue' }]} height="300px" />

const loadGoogleMaps = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  return new Promise((resolve, reject) => {
    const id = 'google-maps-script';
    if (document.getElementById(id)) {
      // wait for global to be available
      const check = () => {
        if (window.google && window.google.maps) return resolve(window.google.maps);
        setTimeout(check, 50);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to initialize'));
    };
    script.onerror = (err) => reject(err || new Error('Google Maps script error'));
    document.head.appendChild(script);
  });
};

export default function GoogleMap({
  query,
  markers = [], // [{ lat, lng, title } | { query, title }]
  center,
  zoom = 12,
  height = '200px',
  className = '',
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY is not set — GoogleMap will not render');
      return;
    }

    let mounted = true;
    let geocoder;
    let bounds;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!mounted) return;
        mapRef.current = new maps.Map(elRef.current, {
          center: center || { lat: 0, lng: 0 },
          zoom,
        });
        geocoder = new maps.Geocoder();
        bounds = new maps.LatLngBounds();

        const addMarker = (position, title) => {
          const marker = new maps.Marker({ position, map: mapRef.current, title });
          bounds.extend(position);
          const info = new maps.InfoWindow({
            content: `<div style="min-width:140px"><strong>${title || ''}</strong><div style="margin-top:6px"><a href=\"https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              title || `${position.lat},${position.lng}`
            )}\" target=\"_blank\">Open in Google Maps</a></div></div>`,
          });
          marker.addListener('click', () => info.open(mapRef.current, marker));
        };

        const process = (m) => {
          if (!m) return;
          if (m.lat != null && m.lng != null) {
            addMarker({ lat: m.lat, lng: m.lng }, m.title || m.label || '');
            mapRef.current.fitBounds(bounds);
            return;
          }
          const address = m.address || m.query || m;
          if (address) {
            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const loc = results[0].geometry.location;
                addMarker({ lat: loc.lat(), lng: loc.lng() }, m.title || address);
                mapRef.current.fitBounds(bounds);
              } else {
                // silent failure is okay — show nothing for this marker
                // console.warn('Geocode failed for', address, status);
              }
            });
          }
        };

        // markers prop takes precedence
        if (Array.isArray(markers) && markers.length > 0) {
          markers.forEach(process);
        } else if (query) {
          // single query
          process({ query });
        } else if (center) {
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(zoom);
        }
      })
      .catch((err) => {
        console.error('Google Maps load error', err);
      });

    return () => {
      mounted = false;
      // no special cleanup is required for maps script; GC will handle DOM node
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [query, JSON.stringify(markers), center, zoom]);

  return (
    <div
      ref={elRef}
      className={className}
      style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
