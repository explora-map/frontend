import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
    const { username } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const tarxetas = [
        {
            ruta: '/mapas',
            titulo: t('dashboard.mapas.titulo'),
            descriccion: t('dashboard.mapas.descriccion'),
            btn: t('dashboard.mapas.btn'),
            aria: t('dashboard.mapas.aria'),
        },
        {
            ruta: '/',
            titulo: t('dashboard.explorar.titulo'),
            descriccion: t('dashboard.explorar.descriccion'),
            btn: t('dashboard.explorar.btn'),
            aria: t('dashboard.explorar.aria'),
        },
        {
            ruta: '/convites',
            titulo: t('dashboard.convites.titulo'),
            descriccion: t('dashboard.convites.descriccion'),
            btn: t('dashboard.convites.btn'),
            aria: t('dashboard.convites.aria'),
        },
    ];

    return (
        <div className="dashboard">
            <h1 className="dashboard__benvida">
                {t('dashboard.benvida', { username: username || '' })}
            </h1>
            <div className="dashboard__tarxetas">
                {tarxetas.map(({ ruta, titulo, descriccion, btn, aria }) => (
                    <article
                        key={ruta}
                        className="dashboard__tarxeta"
                        aria-label={aria}
                    >
                        <h2 className="dashboard__tarxeta-titulo">{titulo}</h2>
                        <p className="dashboard__tarxeta-descriccion">{descriccion}</p>
                        <button
                            className="dashboard__tarxeta-btn"
                            onClick={() => navigate(ruta)}
                        >
                            {btn}
                        </button>
                    </article>
                ))}
            </div>
        </div>
    );
}
