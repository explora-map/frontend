// CategoriaPanel.jsx
// Shown on MapaDetallePage to list categories and, for owners, create or delete them.
// categorias and reload are owned by MapaDetallePage and passed as props to keep state in sync.

import React, { useState } from 'react';
import { crearCategoria, eliminarCategoria, editarCategoria } from '../services/categoriaApi';
import textos from '../constants/textos';
import ConfirmDialog from './ConfirmDialog';

export default function CategoriaPanel({ mapaId, esPropietario, categorias, onCambio }) {
    const [erro, setErro] = useState('');

    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [nomeEdit, setNomeEdit] = useState('');
    const [corEdit, setCorEdit] = useState('#3B82F6');
    const [iconaEdit, setIconaEdit] = useState('');
    const [erroEdit, setErroEdit] = useState('');
    const [gardandoEdit, setGardandoEdit] = useState(false);

    const [mostrarForm, setMostrarForm] = useState(false);
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState('#3B82F6');
    const [icona, setIcona] = useState('');
    const [gardando, setGardando] = useState(false);
    const [erroForm, setErroForm] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [accionPendente, setAccionPendente] = useState(null);

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
            setErroForm(textos.categorias.validNomeObrigatorio);
            return;
        }

        setGardando(true);
        setErroForm('');
        try {
            await crearCategoria(mapaId, { nome: nome.trim(), cor, icona: icona || null });
            resetForm();
            await onCambio();
        } catch (err) {
            setErroForm(err.response?.data?.message || textos.categorias.errorGardar);
        } finally {
            setGardando(false);
        }
    }

    async function handleEditarCategoria() {
        if (!nomeEdit.trim()) {
            setErroEdit(textos.categorias.validNomeObrigatorio);
            return;
        }
        setGardandoEdit(true);
        try {
            await editarCategoria(categoriaEditando.id, { nome: nomeEdit.trim(), cor: corEdit, icona: iconaEdit || null });
            setCategoriaEditando(null);
            setNomeEdit('');
            setCorEdit('#3B82F6');
            setIconaEdit('');
            setErroEdit('');
            await onCambio();
        } catch (err) {
            setErroEdit(err.response?.data?.message || textos.categorias.errorGardar);
        } finally {
            setGardandoEdit(false);
        }
    }

    function solicitarEliminar(categoria) {
        setAccionPendente(categoria);
        setConfirmOpen(true);
    }

    async function executeEliminar() {
        const cat = accionPendente;
        setConfirmOpen(false);
        setAccionPendente(null);
        try {
            await eliminarCategoria(cat.id);
            await onCambio();
        } catch {
            setErro(textos.categorias.errorEliminar);
        }
    }

    return (
        <>
            <div className="categoria-panel">
                <h3 className="categoria-panel__title">{textos.categorias.titulo}</h3>

                {erro && <p className="categoria-panel__msg categoria-panel__msg--error">{erro}</p>}

                {categorias.length === 0 && (
                    <p className="categoria-panel__state">{textos.categorias.sinCategorias}</p>
                )}

                {categorias.length > 0 && (
                    <ul className="categoria-panel__list">
                        {categorias.map((cat) =>
                            categoriaEditando?.id === cat.id ? (
                                <li key={cat.id} className="categoria-panel__item categoria-panel__item--editing">
                                    <input
                                        className="categoria-panel__input"
                                        type="text"
                                        placeholder={textos.categorias.placeholderNome}
                                        value={nomeEdit}
                                        onChange={(e) => setNomeEdit(e.target.value)}
                                        disabled={gardandoEdit}
                                        aria-label={textos.categorias.campoNome}
                                    />
                                    <input
                                        type="color"
                                        value={corEdit}
                                        onChange={(e) => setCorEdit(e.target.value)}
                                        disabled={gardandoEdit}
                                        aria-label={textos.categorias.campoCor}
                                    />
                                    <input
                                        className="categoria-panel__input"
                                        type="text"
                                        placeholder={textos.categorias.placeholderIcona}
                                        value={iconaEdit}
                                        onChange={(e) => setIconaEdit(e.target.value)}
                                        disabled={gardandoEdit}
                                        aria-label={textos.categorias.campoIcona}
                                    />
                                    {erroEdit && (
                                        <p className="categoria-panel__msg categoria-panel__msg--error">{erroEdit}</p>
                                    )}
                                    <button
                                        className="btn btn--primary btn--sm"
                                        onClick={handleEditarCategoria}
                                        disabled={gardandoEdit}
                                    >
                                        {gardandoEdit ? textos.cargando.gardando : textos.categorias.botonGardar}
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--sm"
                                        onClick={() => {
                                            setCategoriaEditando(null);
                                            setNomeEdit('');
                                            setCorEdit('#3B82F6');
                                            setIconaEdit('');
                                            setErroEdit('');
                                        }}
                                        disabled={gardandoEdit}
                                    >
                                        {textos.categorias.botonCancelar}
                                    </button>
                                </li>
                            ) : (
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
                                    <>
                                        <button
                                            className="btn btn--secondary btn--sm"
                                            onClick={() => {
                                                setCategoriaEditando(cat);
                                                setNomeEdit(cat.nome);
                                                setCorEdit(cat.cor);
                                                setIconaEdit(cat.icona || '');
                                                setErroEdit('');
                                            }}
                                        >
                                            {textos.categorias.botonEditar}
                                        </button>
                                        <button
                                            className="btn btn--danger btn--sm"
                                            onClick={() => solicitarEliminar(cat)}
                                        >
                                            {textos.categorias.botonEliminar}
                                        </button>
                                    </>
                                )}
                            </li>
                            )
                        )}
                    </ul>
                )}

                {esPropietario && !mostrarForm && (
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        {textos.categorias.novaCategoria}
                    </button>
                )}

                {esPropietario && mostrarForm && (
                    <form className="categoria-panel__form" onSubmit={handleCrear}>
                        <input
                            className="categoria-panel__input"
                            type="text"
                            placeholder={textos.categorias.placeholderNome}
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={gardando}
                            aria-label={textos.categorias.campoNome}
                        />
                        <input
                            type="color"
                            value={cor}
                            onChange={(e) => setCor(e.target.value)}
                            disabled={gardando}
                            aria-label={textos.categorias.campoCor}
                        />
                        <input
                            className="categoria-panel__input"
                            type="text"
                            placeholder={textos.categorias.placeholderIcona}
                            value={icona}
                            onChange={(e) => setIcona(e.target.value)}
                            disabled={gardando}
                            aria-label={textos.categorias.campoIcona}
                        />
                        {erroForm && (
                            <p className="categoria-panel__msg categoria-panel__msg--error">{erroForm}</p>
                        )}
                        <button className="btn btn--primary btn--sm" type="submit" disabled={gardando}>
                            {gardando ? textos.cargando.gardando : textos.categorias.botonGardar}
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            type="button"
                            onClick={resetForm}
                            disabled={gardando}
                        >
                            {textos.categorias.botonCancelar}
                        </button>
                    </form>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title={textos.categorias.confirmEliminarTitulo}
                message={textos.categorias.confirmEliminarMensaxe}
                confirmLabel={textos.categorias.confirmEliminarBoton}
                variant="danger"
                onConfirm={executeEliminar}
                onCancel={() => { setConfirmOpen(false); setAccionPendente(null); }}
            />
        </>
    );
}
