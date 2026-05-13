import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verificarConta } from '../services/authApi';

export default function VerificarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('cargando');
  const [mensaxe, setMensaxe] = useState('');

  // Prevent double execution in React StrictMode
  const chamadaFeita = useRef(false);

  useEffect(() => {
    if (!token) {
      setEstado('erro');
      setMensaxe('Token de verificación non atopado na URL.');
      return;
    }

    // Guard against double invocation in React StrictMode
    if (chamadaFeita.current) return;
    chamadaFeita.current = true;

    async function verificar() {
      try {
        const data = await verificarConta(token);
        setMensaxe(data.message || 'Conta verificada correctamente.');
        setEstado('ok');
      } catch (err) {
        const mensaxeErro = err.response?.data?.message || 'O token non é válido ou xa caducou.';
        // If token was already used but account is verified, treat as success
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
              <span style={{ display:'inline-flex', width:'32px', height:'32px', position:'relative' }}>
                <span style={{ position:'absolute', top:'50%', left:0, width:'100%', height:'3px', backgroundColor:'currentColor', borderRadius:'2px', transform:'translateY(-50%) rotate(45deg)' }} />
                <span style={{ position:'absolute', top:'50%', left:0, width:'100%', height:'3px', backgroundColor:'currentColor', borderRadius:'2px', transform:'translateY(-50%) rotate(-45deg)' }} />
              </span>
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
