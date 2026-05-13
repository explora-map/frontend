import React, { useState, useEffect, useCallback } from 'react';
import { obterHistorial, obterHistorialPorTipo } from '../services/historialApi';

const FILTROS = [
    { label: 'Todos', valor: '' },
    { label: 'Marcadores', valor: 'MARCADOR' },
    { label: 'Categorías', valor: 'CATEGORIA' },
];

const ACCION_LABEL = {
    CREAR: 'Creou',
    EDITAR: 'Editou',
    ELIMINAR: 'Eliminou',
};

const ACCION_CLASS = {
    CREAR: 'historial-panel__badge--crear',
    EDITAR: 'historial-panel__badge--editar',
    ELIMINAR: 'historial-panel__badge--eliminar',
};

const ELEMENTO_LABEL = {
    MAPA: 'o mapa',
    MARCADOR: 'o marcador',
    CATEGORIA: 'a categoría',
};

export default function HistorialPanel({ mapaId, usuarioActual }) {
    const [entradas, setEntradas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [erro, setErro] = useState('');
    const [filtro, setFiltro] = useState('');

    const cargarHistorial = useCallback(async (tipo) => {
        setCargando(true);
        setErro('');
        try {
            const data = tipo
                ? await obterHistorialPorTipo(mapaId, tipo)
                : await obterHistorial(mapaId);
            setEntradas(data);
        } catch {
            setErro('Non foi posible cargar o historial. Tenta de novo.');
        } finally {
            setCargando(false);
        }
    }, [mapaId]);

    useEffect(() => {
        cargarHistorial(filtro);
    }, [cargarHistorial, filtro]);

    return (
        <div className="historial-panel">
            <h3 className="historial-panel__title">Historial</h3>

            <div className="historial-panel__filtros">
                {FILTROS.map((f) => (
                    <button
                        key={f.valor}
                        className={`historial-panel__filtro-btn${filtro === f.valor ? ' historial-panel__filtro-btn--activo' : ''}`}
                        onClick={() => setFiltro(f.valor)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {erro && (
                <p className="historial-panel__msg historial-panel__msg--error" role="alert">
                    {erro}
                </p>
            )}

            {cargando && (
                <p className="historial-panel__state">Cargando historial...</p>
            )}

            {!cargando && !erro && entradas.length === 0 && (
                <p className="historial-panel__state">Non hai rexistros no historial</p>
            )}

            {!cargando && entradas.length > 0 && (
                <ul className="historial-panel__list">
                    {entradas.map((entrada) => (
                        <li key={entrada.id} className="historial-panel__item">
                            <span className={`historial-panel__badge ${ACCION_CLASS[entrada.tipoAccion] ?? ''}`}>
                                {ACCION_LABEL[entrada.tipoAccion] ?? entrada.tipoAccion}
                            </span>
                            {' '}
                            {ELEMENTO_LABEL[entrada.tipoElemento] ?? entrada.tipoElemento}
                            {' '}
                            <span className="historial-panel__nome">"{entrada.elementoNome}"</span>
                            {' — '}
                            <span className="historial-panel__usuaria">
                                {entrada.usuaria}
                                {entrada.usuaria === usuarioActual && (
                                    <span className="historial-panel__ti"> (ti)</span>
                                )}
                            </span>
                            <span className="historial-panel__separador"> · </span>
                            <span className="historial-panel__data">
                                {new Date(entrada.dataAccion).toLocaleString('gl-ES')}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
