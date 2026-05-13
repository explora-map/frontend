// CategoriaPanel.jsx
// Shown on MapaDetallePage to list categories and, for owners, create or delete them.
// categorias and reload are owned by MapaDetallePage and passed as props to keep state in sync.

import React, { useState, useRef } from 'react';
import { crearCategoria, eliminarCategoria, editarCategoria } from '../services/categoriaApi';
import textos from '../constants/textos';
import ConfirmDialog from './ConfirmDialog';
import FormModal from './FormModal';

const CORES_PREDEFINIDAS = [
    '#C0392B', '#D4600A', '#B8860B', '#2E7D32', '#1565C0',
    '#6A1B9A', '#AD1457', '#37474F', '#00695C', '#283593',
];

function SelectorCor({ cor, onChange, disabled }) {
    const inputRef = useRef(null);
    const esPersonalizada = !CORES_PREDEFINIDAS.some(
        (c) => c.toLowerCase() === cor.toLowerCase()
    );

    return (
        <div className="cor-selector" role="group" aria-label="Seleccionar cor">
            {CORES_PREDEFINIDAS.map((c) => (
                <button
                    key={c}
                    type="button"
                    className={`cor-selector__opcion${cor.toLowerCase() === c.toLowerCase() ? ' cor-selector__opcion--activa' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                    aria-pressed={cor.toLowerCase() === c.toLowerCase()}
                    onClick={() => onChange(c)}
                    disabled={disabled}
                />
            ))}
            <button
                type="button"
                className={`cor-selector__opcion cor-selector__opcion--custom${esPersonalizada ? ' cor-selector__opcion--activa' : ''}`}
                aria-label="Cor personalizada"
                aria-pressed={esPersonalizada}
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
            />
            <input
                ref={inputRef}
                type="color"
                value={cor}
                onChange={(e) => onChange(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
                className="cor-selector__input-oculto"
            />
        </div>
    );
}

export default function CategoriaPanel({ mapaId, esPropietario, categorias, onCambio }) {
    const [erro, setErro] = useState('');

    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [nomeEdit, setNomeEdit] = useState('');
    const [corEdit, setCorEdit] = useState('#3B82F6');
    const [erroEdit, setErroEdit] = useState('');
    const [gardandoEdit, setGardandoEdit] = useState(false);

    const [mostrarForm, setMostrarForm] = useState(false);
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState('#3B82F6');
    const [gardando, setGardando] = useState(false);
    const [erroForm, setErroForm] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [accionPendente, setAccionPendente] = useState(null);

    function resetForm() {
        setMostrarForm(false);
        setNome('');
        setCor('#3B82F6');
        setErroForm('');
    }

    function resetEdit() {
        setCategoriaEditando(null);
        setNomeEdit('');
        setCorEdit('#3B82F6');
        setErroEdit('');
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
            await crearCategoria(mapaId, { nome: nome.trim(), cor });
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
            await editarCategoria(categoriaEditando.id, { nome: nomeEdit.trim(), cor: corEdit });
            resetEdit();
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
                        {categorias.map((cat) => (
                            <li key={cat.id} className="categoria-panel__item">
                                <div
                                    className="categoria-panel__cor"
                                    style={{ backgroundColor: cat.cor, width: 16, height: 16 }}
                                />
                                <span className="categoria-panel__nome">{cat.nome}</span>
                                {esPropietario && (
                                    <>
                                        <button
                                            className="btn btn--secondary btn--sm"
                                            onClick={() => {
                                                setCategoriaEditando(cat);
                                                setNomeEdit(cat.nome);
                                                setCorEdit(cat.cor);
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
                        ))}
                    </ul>
                )}

                {esPropietario && (
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        {textos.categorias.novaCategoria}
                    </button>
                )}
            </div>

            {mostrarForm && (
                <FormModal title={textos.categorias.novaCategoria} onClose={resetForm}>
                    <form onSubmit={handleCrear}>
                        <div className="modal-field">
                            <label className="modal-label">{textos.categorias.campoNome}</label>
                            <input
                                className={`modal-input${erroForm ? ' modal-input--error' : ''}`}
                                type="text"
                                placeholder={textos.categorias.placeholderNome}
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={gardando}
                                aria-label={textos.categorias.campoNome}
                            />
                        </div>
                        <div className="modal-field">
                            <label className="modal-label">Cor</label>
                            <SelectorCor cor={cor} onChange={setCor} disabled={gardando} />
                        </div>
                        {erroForm && <p className="modal-error">{erroForm}</p>}
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="modal-btn-cancelar"
                                onClick={resetForm}
                                disabled={gardando}
                            >
                                {textos.categorias.botonCancelar}
                            </button>
                            <button
                                type="submit"
                                className="modal-btn-gardar"
                                disabled={gardando}
                            >
                                {gardando ? textos.cargando.gardando : textos.categorias.botonGardar}
                            </button>
                        </div>
                    </form>
                </FormModal>
            )}

            {categoriaEditando && (
                <FormModal title={textos.categorias.editarCategoria ?? textos.categorias.botonEditar} onClose={resetEdit}>
                    <div className="modal-field">
                        <label className="modal-label">{textos.categorias.campoNome}</label>
                        <input
                            className={`modal-input${erroEdit ? ' modal-input--error' : ''}`}
                            type="text"
                            placeholder={textos.categorias.placeholderNome}
                            value={nomeEdit}
                            onChange={(e) => setNomeEdit(e.target.value)}
                            disabled={gardandoEdit}
                            aria-label={textos.categorias.campoNome}
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Cor</label>
                        <SelectorCor cor={corEdit} onChange={setCorEdit} disabled={gardandoEdit} />
                    </div>
                    {erroEdit && <p className="modal-error">{erroEdit}</p>}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="modal-btn-cancelar"
                            onClick={resetEdit}
                            disabled={gardandoEdit}
                        >
                            {textos.categorias.botonCancelar}
                        </button>
                        <button
                            type="button"
                            className="modal-btn-gardar"
                            onClick={handleEditarCategoria}
                            disabled={gardandoEdit}
                        >
                            {gardandoEdit ? textos.cargando.gardando : textos.categorias.botonGardar}
                        </button>
                    </div>
                </FormModal>
            )}

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
