// CategoriaPanel.jsx
// Shown on MapaDetallePage to list categories and, for owners, create or delete them.
// categorias and reload are owned by MapaDetallePage and passed as props to keep state in sync.

import React, { useState } from 'react';
import { crearCategoria, eliminarCategoria } from '../services/categoriaApi';

export default function CategoriaPanel({ mapaId, esPropietario, categorias, onCambio }) {
    const [erro, setErro] = useState('');

    const [mostrarForm, setMostrarForm] = useState(false);
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState('#3B82F6');
    const [icona, setIcona] = useState('');
    const [gardando, setGardando] = useState(false);
    const [erroForm, setErroForm] = useState('');

    function resetForm() {
        setMostrarForm(false);
        setNome('');
        setCor('#3B82F6');
        setIcona('');
        setErroForm('');
    }

    async function handleCrear(e) {
        e.preventDefault();
        if (!nome.trim()) {
            setErroForm('O nome é obrigatorio.');
            return;
        }

        setGardando(true);
        setErroForm('');
        try {
            await crearCategoria(mapaId, { nome: nome.trim(), cor, icona: icona || null });
            resetForm();
            await onCambio();
        } catch (err) {
            setErroForm(err.response?.data?.message || 'Erro ao gardar');
        } finally {
            setGardando(false);
        }
    }

    async function handleEliminar(categoria) {
        if (!window.confirm(`Eliminar a categoría "${categoria.nome}"?`)) return;
        try {
            await eliminarCategoria(categoria.id);
            await onCambio();
        } catch {
            setErro('Non foi posible eliminar a categoría.');
        }
    }

    return (
        <div className="categoria-panel">
            <h3 className="categoria-panel__title">Categorías</h3>

            {erro && <p className="categoria-panel__msg categoria-panel__msg--error">{erro}</p>}

            {categorias.length === 0 && (
                <p className="categoria-panel__state">Non hai categorías para este mapa.</p>
            )}

            {categorias.length > 0 && (
                <ul className="categoria-panel__list">
                    {categorias.map((cat) => (
                        <li key={cat.id} className="categoria-panel__item">
                            <div
                                className="categoria-panel__cor"
                                style={{ backgroundColor: cat.cor, width: 16, height: 16 }}
                            />
                            <span className="categoria-panel__nome">{cat.nome}</span>
                            {cat.icona && (
                                <span className="categoria-panel__icona">({cat.icona})</span>
                            )}
                            {esPropietario && (
                                <button
                                    className="btn btn--danger btn--sm"
                                    onClick={() => handleEliminar(cat)}
                                >
                                    Eliminar
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {esPropietario && !mostrarForm && (
                <button
                    className="btn btn--primary btn--sm"
                    onClick={() => setMostrarForm(true)}
                >
                    Nova categoría
                </button>
            )}

            {esPropietario && mostrarForm && (
                <form className="categoria-panel__form" onSubmit={handleCrear}>
                    <input
                        className="categoria-panel__input"
                        type="text"
                        placeholder="Nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={gardando}
                        aria-label="Nome da categoría"
                    />
                    <input
                        type="color"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        disabled={gardando}
                        aria-label="Cor da categoría"
                    />
                    <input
                        className="categoria-panel__input"
                        type="text"
                        placeholder="ex: star, home, flag"
                        value={icona}
                        onChange={(e) => setIcona(e.target.value)}
                        disabled={gardando}
                        aria-label="Icona da categoría (opcional)"
                    />
                    {erroForm && (
                        <p className="categoria-panel__msg categoria-panel__msg--error">{erroForm}</p>
                    )}
                    <button className="btn btn--primary btn--sm" type="submit" disabled={gardando}>
                        {gardando ? 'Gardando…' : 'Gardar'}
                    </button>
                    <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={resetForm}
                        disabled={gardando}
                    >
                        Cancelar
                    </button>
                </form>
            )}
        </div>
    );
}
