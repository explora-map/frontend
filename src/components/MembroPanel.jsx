import React, { useState, useEffect, useCallback } from 'react';
import { listarMembros, cambiarRol, eliminarMembro } from '../services/mapaMembroApi';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';

const ROLES = ['MEMBRO', 'COLABORADORA', 'ADMIN_MAPA'];

const ROL_LABEL = {
    MEMBRO: 'Membro',
    COLABORADORA: 'Colaboradora',
    ADMIN_MAPA: 'Administrador',
};

export default function MembroPanel({ mapaId, creadoPor }) {
    const { username } = useAuth();
    const esPropietario = username === creadoPor;

    const [membros, setMembros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [erro, setErro] = useState('');

    const [rolGardando, setRolGardando] = useState(null);
    const [rolFeedback, setRolFeedback] = useState(null);
    const [erroRol, setErroRol] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [membroEliminar, setMembroEliminar] = useState(null);
    const [erroEliminar, setErroEliminar] = useState('');

    const cargarMembros = useCallback(async () => {
        setCargando(true);
        setErro('');
        try {
            const data = await listarMembros(mapaId);
            setMembros(data);
        } catch {
            setErro('Non foi posible cargar os membros. Tenta de novo.');
        } finally {
            setCargando(false);
        }
    }, [mapaId]);

    useEffect(() => {
        cargarMembros();
    }, [cargarMembros]);

    async function handleCambiarRol(username, novoRol) {
        setRolGardando(username);
        setErroRol('');
        setRolFeedback(null);
        try {
            await cambiarRol(mapaId, username, novoRol);
            setMembros((prev) =>
                prev.map((m) => (m.username === username ? { ...m, rol: novoRol } : m))
            );
            setRolFeedback(username);
            setTimeout(() => setRolFeedback(null), 3000);
        } catch (err) {
            setErroRol(err.response?.data?.message || 'Non foi posible cambiar o rol. Tenta de novo.');
        } finally {
            setRolGardando(null);
        }
    }

    function solicitarEliminar(membro) {
        setMembroEliminar(membro);
        setConfirmOpen(true);
    }

    async function executeEliminar() {
        const membro = membroEliminar;
        setConfirmOpen(false);
        setMembroEliminar(null);
        setErroEliminar('');
        try {
            await eliminarMembro(mapaId, membro.username);
            setMembros((prev) => prev.filter((m) => m.username !== membro.username));
        } catch (err) {
            setErroEliminar(err.response?.data?.message || 'Non foi posible eliminar o membro. Tenta de novo.');
        }
    }

    return (
        <>
            <div className="membro-panel">
                <h3 className="membro-panel__title">Membros</h3>

                {erro && (
                    <p className="membro-panel__msg membro-panel__msg--error" role="alert">
                        {erro}
                    </p>
                )}
                {erroRol && (
                    <p className="membro-panel__msg membro-panel__msg--error" role="alert">
                        {erroRol}
                    </p>
                )}
                {erroEliminar && (
                    <p className="membro-panel__msg membro-panel__msg--error" role="alert">
                        {erroEliminar}
                    </p>
                )}

                {cargando && (
                    <p className="membro-panel__state">Cargando membros...</p>
                )}

                {!cargando && !erro && membros.length === 0 && (
                    <p className="membro-panel__state">Aínda non hai membros.</p>
                )}

                {!cargando && membros.length > 0 && (
                    <ul className="membro-panel__list">
                        {membros.map((m) => (
                            <li key={m.username} className="membro-panel__item">
                                <span className="membro-panel__username">{m.username}</span>

                                {esPropietario ? (
                                    <select
                                        className="membro-panel__rol-select"
                                        value={m.rol}
                                        onChange={(e) => handleCambiarRol(m.username, e.target.value)}
                                        disabled={rolGardando === m.username}
                                        aria-label={`Rol de ${m.username}`}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>{ROL_LABEL[r]}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="membro-panel__rol-label">
                                        {ROL_LABEL[m.rol] ?? m.rol}
                                    </span>
                                )}

                                {rolFeedback === m.username && (
                                    <span className="membro-panel__feedback" aria-live="polite">
                                        Gardado
                                    </span>
                                )}

                                {esPropietario && (
                                    <button
                                        className="btn btn--danger btn--sm"
                                        onClick={() => solicitarEliminar(m)}
                                        disabled={rolGardando === m.username}
                                        aria-label={`Eliminar ${m.username}`}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar membro"
                message={`Seguro que queres eliminar a ${membroEliminar?.username} do mapa? Esta acción non se pode desfacer.`}
                confirmLabel="Eliminar"
                variant="danger"
                onConfirm={executeEliminar}
                onCancel={() => { setConfirmOpen(false); setMembroEliminar(null); }}
            />
        </>
    );
}
