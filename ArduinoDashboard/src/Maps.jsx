import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';

// Default icon fix
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Monaco Circuit — default center
const DEFAULT_LAT = 43.7347;
const DEFAULT_LON = 7.4205;

function makePulseIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;animation:gps-ring 1.6s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color};"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/**
 * Full-screen background map with a marker at the user's real GPS location.
 * Uses navigator.geolocation.getCurrentPosition + watchPosition.
 *
 * Props:
 *   panelOpen  – boolean, triggers invalidateSize after CSS transition
 *   irAlert    – boolean, colours the marker red when obstacle detected
 */
export default function LiveMap({ panelOpen = false, irAlert = false, onPositionChange }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const watchIdRef   = useRef(null);

  // Initialise map and start geolocation once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (container._leaflet_id) return;

    const map = L.map(container, {
      center: [DEFAULT_LAT, DEFAULT_LON],
      zoom: 15,
      zoomControl: false,
    });

    new MaptilerLayer({
      apiKey: import.meta.env.VITE_MAP_API_KEY,
      style: 'streets-v4-dark',
    }).addTo(map);

    const marker = L.marker([DEFAULT_LAT, DEFAULT_LON], {
      icon: makePulseIcon('#4facfe'),
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;
    window._leafletMap = map;

    let userLocated = false;
    function updatePosition(pos) {
      const { latitude, longitude } = pos.coords;
      const latLng = [latitude, longitude];
      if (typeof onPositionChange === 'function') onPositionChange(latitude, longitude);
      marker.setLatLng(latLng);
      if (!userLocated) {
        map.setView(latLng, 16);
        userLocated = true;
      } else if (map.distance(map.getCenter(), latLng) > 100) {
        map.panTo(latLng, { animate: true, duration: 0.5 });
      }
    }

    function onError(err) {
      console.warn('Geolocation error:', err.message);
    }

    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(updatePosition, onError, opts);
    watchIdRef.current = navigator.geolocation.watchPosition(updatePosition, onError, opts);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      window._leafletMap = null;
    };
  }, []);

  // Update marker colour when IR alert state changes
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setIcon(makePulseIcon(irAlert ? '#e8002d' : '#4facfe'));
  }, [irAlert]);

  // Map stays full width (sidebar overlays), so no invalidateSize needed on panel toggle

  return <div ref={containerRef} id="mapCanvas" />;
}
