// CategoriaPanel.jsx
// Shown on MapaDetallePage to list categories and, for owners, create or delete them.
// categorias and reload are owned by MapaDetallePage and passed as props to keep state in sync.

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { crearCategoria, eliminarCategoria, editarCategoria } from '../services/categoriaApi';
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

export default function CategoriaPanel({ mapaId, esPropietario, categorias, onCambio, podeCrear, podeEditarCalquera, usernameActual }) {
    const { t } = useTranslation();
    const canCreate = podeCrear ?? esPropietario;
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
            // TODO: add categorias.validNomeObrigatorio to translation files
            setErroForm('O nome é obrigatorio.');
            return;
        }

        setGardando(true);
        setErroForm('');
        try {
            await crearCategoria(mapaId, { nome: nome.trim(), cor });
            resetForm();
            await onCambio();
        } catch (err) {
            setErroForm(err.response?.data?.message || t('erros.xenerico'));
        } finally {
            setGardando(false);
        }
    }

    async function handleEditarCategoria() {
        if (!nomeEdit.trim()) {
            // TODO: add categorias.validNomeObrigatorio to translation files
            setErroEdit('O nome é obrigatorio.');
            return;
        }
        setGardandoEdit(true);
        try {
            await editarCategoria(categoriaEditando.id, { nome: nomeEdit.trim(), cor: corEdit });
            resetEdit();
            await onCambio();
        } catch (err) {
            setErroEdit(err.response?.data?.message || t('erros.xenerico'));
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
            setErro(t('erros.xenerico'));
        }
    }

    return (
        <>
            <div className="categoria-panel">
                <h3 className="categoria-panel__title">{t('categorias.titulo')}</h3>

                {erro && <p className="categoria-panel__msg categoria-panel__msg--error">{erro}</p>}

                {/* TODO: add categorias.sinCategorias to translation files */}
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
                                {(podeEditarCalquera !== undefined
                                    ? (podeEditarCalquera || cat.creadoPor === usernameActual)
                                    : esPropietario) && (
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
                                            {/* TODO: add categorias.botonEditar to translation files */}
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn--danger btn--sm"
                                            onClick={() => solicitarEliminar(cat)}
                                        >
                                            {t('categorias.botonEliminar')}
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {canCreate && (
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        {t('categorias.engadirCategoria')}
                    </button>
                )}
            </div>

            {mostrarForm && (
                <FormModal title={t('categorias.engadirCategoria')} onClose={resetForm}>
                    <form onSubmit={handleCrear}>
                        <div className="modal-field">
                            <label className="modal-label">{t('categorias.campoNome')}</label>
                            <input
                                className={`modal-input${erroForm ? ' modal-input--error' : ''}`}
                                type="text"
                                placeholder={t('categorias.campoNome')}
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={gardando}
                                aria-label={t('categorias.campoNome')}
                            />
                        </div>
                        <div className="modal-field">
                            <label className="modal-label">{t('categorias.campoCor')}</label>
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
                                {t('categorias.botonCancelar')}
                            </button>
                            <button
                                type="submit"
                                className="modal-btn-gardar"
                                disabled={gardando}
                            >
                                {gardando ? t('cargando.gardando') : t('categorias.botonGardar')}
                            </button>
                        </div>
                    </form>
                </FormModal>
            )}

            {categoriaEditando && (
                // TODO: add categorias.botonEditar to translation files (used as modal title)
                <FormModal title="Editar" onClose={resetEdit}>
                    <div className="modal-field">
                        <label className="modal-label">{t('categorias.campoNome')}</label>
                        <input
                            className={`modal-input${erroEdit ? ' modal-input--error' : ''}`}
                            type="text"
                            placeholder={t('categorias.campoNome')}
                            value={nomeEdit}
                            onChange={(e) => setNomeEdit(e.target.value)}
                            disabled={gardandoEdit}
                            aria-label={t('categorias.campoNome')}
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">{t('categorias.campoCor')}</label>
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
                            {t('categorias.botonCancelar')}
                        </button>
                        <button
                            type="button"
                            className="modal-btn-gardar"
                            onClick={handleEditarCategoria}
                            disabled={gardandoEdit}
                        >
                            {gardandoEdit ? t('cargando.gardando') : t('categorias.botonGardar')}
                        </button>
                    </div>
                </FormModal>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title={t('categorias.confirmEliminarTitulo')}
                message={t('categorias.confirmEliminarMensaxe')}
                confirmLabel={t('categorias.confirmEliminarBoton')}
                variant="danger"
                onConfirm={executeEliminar}
                onCancel={() => { setConfirmOpen(false); setAccionPendente(null); }}
            />
        </>
    );
}
