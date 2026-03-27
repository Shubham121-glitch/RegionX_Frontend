import { useEffect, useRef, useState } from 'react';
import { getStaticMapUrl } from '../../utils/imageHelpers';

// Lightweight Google Maps loader + React wrapper
// Usage examples:
// <GoogleMap query="Eiffel Tower, Paris" height="220px" />
// <GoogleMap markers={[{ query: 'Statue of Liberty, NY', title: 'Statue' }]} height="300px" />

const loadGoogleMaps = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);

  const id = 'google-maps-script';
  let script = document.getElementById(id);

  return new Promise((resolve, reject) => {
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      document.head.appendChild(script);
    }

    const onLoad = () => {
      if (window.google && window.google.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to initialize'));
    };

    const onError = (err) => reject(err || new Error('Google Maps script error'));

    if (window.google && window.google.maps) {
      onLoad();
    } else {
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
    }
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
  const [loadError, setLoadError] = useState(false);
  const markersRef = useRef([]);

  useEffect(() => {
    const rawApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim() : null;
    if (!apiKey) {
      console.error('GoogleMap: VITE_GOOGLE_MAPS_API_KEY is missing');
      setLoadError(true);
      return;
    }

    let mounted = true;

    // Listen for global auth failure from Google Maps (RefererNotAllowedMapError etc)
    const originalAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.error('GoogleMap: Global Auth Failure detected (likely Referrer restriction)');
      if (mounted) setLoadError(true);
      if (originalAuthFailure) originalAuthFailure();
    };

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!mounted) return;
        
        mapRef.current = new maps.Map(elRef.current, {
          center: center || { lat: 0, lng: 0 },
          zoom,
          disableDefaultUI: true, // cleaner look
          zoomControl: true,
        });

        const geocoder = new maps.Geocoder();
        const bounds = new maps.LatLngBounds();

        const addMarker = (position, title) => {
          const marker = new maps.Marker({ 
            position, 
            map: mapRef.current, 
            title: String(title || '') 
          });
          markersRef.current.push(marker);
          bounds.extend(position);
          
          const info = new maps.InfoWindow({
            content: `<div style="padding:4px; max-width:200px; font-family: sans-serif;">
              <strong style="display:block;margin-bottom:4px;">${title || 'Location'}</strong>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title || `${position.lat, position.lng}`)}" 
                 target="_blank" style="color:#2196F3;text-decoration:none;font-size:12px;">Open in Google Maps</a>
            </div>`,
          });
          
          marker.addListener('click', () => info.open(mapRef.current, marker));
        };

        const processMarker = (m) => {
          return new Promise((resolve) => {
            if (!m) return resolve();
            if (m.lat != null && m.lng != null) {
              addMarker({ lat: m.lat, lng: m.lng }, m.title || m.label || '');
              return resolve();
            }
            
            const rawAddress = m.address || m.query || m;
            // Filter out full URLs which break geocoding
            const address = (typeof rawAddress === 'string' && rawAddress.startsWith('http')) 
              ? m.title 
              : rawAddress;

            if (address && typeof address === 'string') {
              geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  const loc = results[0].geometry.location;
                  addMarker({ lat: loc.lat(), lng: loc.lng() }, m.title || address);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        };

        const list = Array.isArray(markers) && markers.length > 0 ? markers : (query ? [{ query }] : []);
        
        Promise.all(list.map(processMarker)).then(() => {
          if (!mounted) return;
          if (markersRef.current.length > 0) {
            mapRef.current.fitBounds(bounds);
            // Don't zoom in too far for single markers
            if (markersRef.current.length === 1) {
              const listener = maps.event.addListener(mapRef.current, 'idle', () => {
                if (mapRef.current.getZoom() > zoom) mapRef.current.setZoom(zoom);
                maps.event.removeListener(listener);
              });
            }
          } else if (center) {
            mapRef.current.setCenter(center);
            mapRef.current.setZoom(zoom);
          }
        });
      })
      .catch((err) => {
        console.error('Google Maps load error', err);
        if (mounted) setLoadError(true);
      });

    return () => {
      mounted = false;
      window.gm_authFailure = originalAuthFailure;
      // Cleanup markers
      markersRef.current.forEach(m => {
        if (window.google && window.google.maps) {
          window.google.maps.event.clearInstanceListeners(m);
        }
        m.setMap(null);
      });
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [query, markers.length, center, zoom]);

  if (loadError) {
    const staticUrl = getStaticMapUrl({ markers, center, zoom, size: '600x300' });
    console.log('GoogleMap: Rendering fallback with staticUrl:', staticUrl);
    return (
      <div 
        className={`map-fallback ${className}`}
        style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
        onClick={() => {
          const q = markers?.[0]?.title || query || center || 'Location';
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
        }}
      >
        {staticUrl ? (
          <img src={staticUrl} alt="Map Fallback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#666' }}>Google Map Unavailable (Click to open in new tab)</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '10px' }}>
          Static Map Fallback
        </div>
      </div>
    );
  }

  return (
    <div
      ref={elRef}
      className={className}
      style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
