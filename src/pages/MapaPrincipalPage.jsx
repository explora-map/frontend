// MapaPrincipalPage.jsx
// Páxina principal pública na ruta '/'.
// O mapa ocupa o viewport enteiro (position fixed); Sidebar e Notificacións
// renderízanse sobre el grazas ao z-index maior de AppLayout.

import React, { useState, useEffect, useMemo } from 'react';
import MapViewer from '../components/MapViewer';
import MapSearchBar from '../components/MapSearchBar';
import useMapaVisualStore from '../store/useMapaVisualStore';
import useSidebarStore from '../store/useSidebarStore';
import '../assets/styles/mapas.css';
import '../assets/styles/map-search.css';

const GALICIA = { lat: 42.8782, lng: -8.5448, zoom: 8 };

export default function MapaPrincipalPage() {
    const [coords, setCoords] = useState(GALICIA);
    const { expanded } = useSidebarStore();

    const mapasActivos      = useMapaVisualStore((s) => s.mapasActivos);
    const marcadoresPorMapa = useMapaVisualStore((s) => s.marcadoresPorMapa);
    const categoriasActivas = useMapaVisualStore((s) => s.categoriasActivas);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({
                lat:  pos.coords.latitude,
                lng:  pos.coords.longitude,
                zoom: 13,
            }),
            () => {}, // silently fail, keep Galicia default
        );
    }, []);

    function handleLocationSelect({ lat, lng, zoom }) {
        setCoords({ lat, lng, zoom: zoom ?? 14 });
    }

    const marcadoresVisibles = useMemo(() =>
        Object.entries(mapasActivos)
            .filter(([, activo]) => activo)
            .flatMap(([mapaId]) => {
                const marcadores = marcadoresPorMapa[mapaId] ?? [];
                return marcadores.filter((m) =>
                    m.categoriaId == null ||
                    Boolean(categoriasActivas[String(m.categoriaId)]),
                );
            }),
        [mapasActivos, marcadoresPorMapa, categoriasActivas],
    );

    return (
        <div className="mapa-principal">
            <div className={`mapa-principal__search${!expanded ? ' mapa-principal__search--colapsado' : ''}`}>
                <MapSearchBar onLocationSelect={handleLocationSelect} />
            </div>
            <MapViewer
                latitude={coords.lat}
                lonxitude={coords.lng}
                zoom={coords.zoom}
                marker={false}
                height="100vh"
                marcadores={marcadoresVisibles}
            />
        </div>
    );
}
