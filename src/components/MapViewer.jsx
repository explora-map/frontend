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

function crearIconoProvisional() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" opacity="0.8">
          <path
            d="M14 2C8.477 2 4 6.477 4 12c0 7.418 8.667 20.167 9.04 20.708a1.167 1.167 0 0 0 1.92 0C15.333 32.167 24 19.418 24 12c0-5.523-4.477-10-10-10z"
            fill="white"
            stroke="#9E97BB"
            stroke-width="2.5"
            stroke-dasharray="5 3"
          />
          <circle cx="14" cy="12" r="4" fill="#9E97BB" />
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
    });
}

function crearIconoMarcador(cor = '#7C52E8') {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
          <path
            d="M14 2C8.477 2 4 6.477 4 12c0 7.418 8.667 20.167 9.04 20.708a1.167 1.167 0 0 0 1.92 0C15.333 32.167 24 19.418 24 12c0-5.523-4.477-10-10-10z"
            fill="white"
            stroke="${cor}"
            stroke-width="2.5"
          />
          <circle cx="14" cy="12" r="4" fill="${cor}" />
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
    });
}

export default function MapViewer({
    latitude,
    lonxitude,
    zoom = 13,
    marker = true,
    onLocationSelect,
    markerDraggable = false,
    height = '400px',
    marcadores = [],
    provisionalMarker = null,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const marcadoresRefs = useRef([]);
    const provisionalMarkerRef = useRef(null);

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
            provisionalMarkerRef.current = null;
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
            L.marker(
                [item.latitude, item.lonxitude],
                { icon: crearIconoMarcador(item.cor || item.categoriaCor || '#7C52E8') },
            )
                .addTo(mapRef.current)
                .bindPopup(item.nome),
        );
    }, [marcadores]);

    // Provisional marker: shown while a new marker is being placed (grey, dashed outline)
    useEffect(() => {
        if (!mapRef.current) return;
        if (provisionalMarker) {
            const { lat, lng } = provisionalMarker;
            if (provisionalMarkerRef.current) {
                provisionalMarkerRef.current.setLatLng([lat, lng]);
            } else {
                provisionalMarkerRef.current = L.marker(
                    [lat, lng],
                    { icon: crearIconoProvisional(), zIndexOffset: 500 },
                ).addTo(mapRef.current);
            }
            mapRef.current.panTo([lat, lng]);
        } else {
            provisionalMarkerRef.current?.remove();
            provisionalMarkerRef.current = null;
        }
    }, [provisionalMarker]);

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
