'use client';

import { useEffect, useRef } from 'react';

function Map() {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Importación dinámica de Leaflet
    import('leaflet').then((L) => {
      // Verificar nuevamente después de la importación asíncrona
      if (mapRef.current || !mapContainerRef.current) return;

      // Coordenadas de Tierra Alta Hotel
      const lat = -26.089329;
      const lng = -65.920797;

      // Limpiar cualquier instancia previa del contenedor
      const container = mapContainerRef.current;
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = undefined;
      }

      // Crear el mapa
      const map = L.map(container).setView([lat, lng], 13);
      mapRef.current = map;

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Crear ícono con emoji
      const emojiIcon = L.divIcon({
        html: '<div style="font-size: 32px;">📍</div>',
        className: 'emoji-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      // Agregar marcador con emoji
      const marker = L.marker([lat, lng], { icon: emojiIcon }).addTo(map);

      // Agregar popup
      marker.bindPopup('<b>Tierra Alta Hotel</b>').openPopup();
    });

    // Cleanup al desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <style jsx global>{`
        .emoji-marker {
          background: none;
          border: none;
        }
        .leaflet-container {
          z-index: 0;
        }
      `}</style>
      <div 
        ref={mapContainerRef} 
        className="h-[500px] w-full rounded-lg shadow-lg"
      />
    </>
  );
}

export default Map;