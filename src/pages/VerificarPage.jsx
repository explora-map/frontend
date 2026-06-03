import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verificarConta } from '../services/authApi';
import { CheckIcon, CloseIcon } from '../components/Iconas';

export default function VerificarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState(token ? 'cargando' : 'erro');
  const [mensaxe, setMensaxe] = useState(token ? '' : 'Token de verificación non atopado na URL.');

  // Prevent double execution in React StrictMode
  const chamadaFeita = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (chamadaFeita.current) return;
    chamadaFeita.current = true;

    async function verificar() {
      try {
        const data = await verificarConta(token);
        setMensaxe(data.message || 'Conta verificada correctamente.');
        setEstado('ok');
      } catch (err) {
        const mensaxeErro = err.response?.data?.message || 'O token non é válido ou xa caducou.';
        if (err.response?.status === 403 && mensaxeErro.includes('xa foi usado')) {
          setMensaxe('Conta verificada correctamente. Xa podes iniciar sesión.');
          setEstado('ok');
        } else {
          setMensaxe(mensaxeErro);
          setEstado('erro');
        }
      }
    }

    verificar();
  }, [token]);

  return (
    <div className="verificar-page">
      <div className="verificar-card">
        {estado === 'cargando' && (
          <>
            <div className="verificar-card__spinner" aria-label="Verificando conta…" />
            <p className="verificar-card__texto">Verificando a túa conta…</p>
          </>
        )}

        {estado === 'ok' && (
          <>
            <div className="verificar-card__icona verificar-card__icona--ok" aria-hidden="true">
              <span className="tick-icon" />
            </div>
            <h1 className="verificar-card__titulo">Conta verificada</h1>
            <p className="verificar-card__texto">{mensaxe}</p>
            <button
              className="btn btn--primary"
              onClick={() => navigate('/login')}
            >
              Iniciar sesión
            </button>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="verificar-card__icona verificar-card__icona--erro" aria-hidden="true">
              <CloseIcon size={28} />
            </div>
            <h1 className="verificar-card__titulo">Erro de verificación</h1>
            <p className="verificar-card__texto">{mensaxe}</p>
            <button
              className="btn btn--secondary"
              onClick={() => navigate('/rexistro')}
            >
              Volver ao rexistro
            </button>
          </>
        )}
      </div>
    </div>
  );
}
