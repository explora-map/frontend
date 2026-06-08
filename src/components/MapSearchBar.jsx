import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './Iconas';

// Nominatim search with debounce — no external dependencies needed
export default function MapSearchBar({ onLocationSelect, placeholder, onFocus }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function handleChange(e) {
    const valor = e.target.value;
    setQuery(valor);
    setErro('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (valor.trim().length < 3) {
      setResultados([]);
      setAberto(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(valor)}&limit=5&accept-language=gl`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'ExploraMap/1.0' }
        });
        if (!res.ok) throw new Error('Erro na busca');
        const data = await res.json();
        setResultados(data);
        setAberto(data.length > 0);
        if (data.length === 0) setErro(t('mapa.sinResultados'));
      } catch {
        setErro(t('erros.rede'));
        setResultados([]);
        setAberto(false);
      } finally {
        setCargando(false);
      }
    }, 400);
  }

  function handleSeleccionar(resultado) {
    setQuery(resultado.display_name.split(',').slice(0, 2).join(','));
    setResultados([]);
    setAberto(false);
    setErro('');
    onLocationSelect({
      lat: parseFloat(resultado.lat),
      lng: parseFloat(resultado.lon),
      nome: resultado.display_name,
      zoom: 14,
    });
  }

  const placeholderText = placeholder || t('mapa.buscadorPlaceholder');

  return (
    <div className="map-search" ref={wrapperRef} role="search">
      <div className="map-search__input-wrapper">
        <span className="map-search__icona-busca" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          className="map-search__input"
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={onFocus}
          placeholder={placeholderText}
          aria-label={placeholderText}
          aria-expanded={aberto}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {cargando && (
          <span className="map-search__spinner" aria-hidden="true" />
        )}
        {query.length > 0 && !cargando && (
          <button
            className="map-search__btn-limpar"
            onClick={() => { setQuery(''); setResultados([]); setAberto(false); setErro(''); }}
            aria-label="Limpar busca"
            tabIndex={0}
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {erro && !aberto && (
        <p className="map-search__erro" role="status" aria-live="polite">{erro}</p>
      )}

      {aberto && resultados.length > 0 && (
        <ul
          className="map-search__resultados"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {resultados.map((r) => (
            <li
              key={r.place_id}
              role="option"
              className="map-search__resultado-item"
              onClick={() => handleSeleccionar(r)}
              onKeyDown={e => e.key === 'Enter' && handleSeleccionar(r)}
              tabIndex={0}
            >
              <span className="map-search__resultado-icona" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </span>
              <span className="map-search__resultado-texto">
                {r.display_name.split(',').slice(0, 3).join(',')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
