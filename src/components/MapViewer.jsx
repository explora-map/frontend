// MapViewer.jsx
// Reusable Leaflet map component.
//
// Props:
//   latitude, lonxitude  — center coordinates (required)
//   zoom                 — default 13
//   marker               — show marker at center (default true)
//   onLocationSelect     — if provided, clicking the map calls
//                          onLocationSelect({lat, lng}) and enables pick mode
//   markerDraggable      — if true, marker is draggable and fires
//                          onLocationSelect on dragend
//   height               — CSS height string (default "400px")
//   marcadores           — array of { id, nome, latitude, lonxitude } to render as
//                          named markers with popups (default [])

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken by Vite/webpack asset hashing
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

export default function MapViewer({
    latitude,
    lonxitude,
    zoom = 13,
    marker = true,
    onLocationSelect,
    markerDraggable = false,
    height = '400px',
    marcadores = [],
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const marcadoresRefs = useRef([]);

    // Initialise the map once on mount
    useEffect(() => {
        if (!containerRef.current) return;

        const map = L.map(containerRef.current).setView(
            [latitude, lonxitude],
            zoom,
        );
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        if (marker) {
            const m = L.marker([latitude, lonxitude], { draggable: markerDraggable }).addTo(map);
            markerRef.current = m;

            if (markerDraggable && onLocationSelect) {
                m.on('dragend', () => {
                    const { lat, lng } = m.getLatLng();
                    onLocationSelect({ lat, lng });
                });
            }
        }

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Register/update the click handler whenever onLocationSelect changes
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        map.off('click');
        if (onLocationSelect) {
            map.on('click', (e) => {
                onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
                if (markerRef.current) {
                    markerRef.current.setLatLng([e.latlng.lat, e.latlng.lng]);
                } else {
                    markerRef.current = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
                }
            });
        }
        return () => {
            map.off('click');
        };
    }, [onLocationSelect]);

    // Render named markers from the marcadores array; remove previous ones first
    useEffect(() => {
        if (!mapRef.current) return;
        marcadoresRefs.current.forEach((m) => m.remove());
        marcadoresRefs.current = marcadores.map((item) =>
            L.marker([item.latitude, item.lonxitude])
                .addTo(mapRef.current)
                .bindPopup(item.nome),
        );
    }, [marcadores]);

    // Keep marker in sync when coordinates change from outside (edit page pre-fill)
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setView([latitude, lonxitude], zoom);
        if (markerRef.current) {
            markerRef.current.setLatLng([latitude, lonxitude]);
        }
    }, [latitude, lonxitude, zoom]);

    return (
        <div
            ref={containerRef}
            className="map-viewer"
            style={{ height, width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
        />
    );
}
