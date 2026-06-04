# explora-map · frontend

SPA de cartografía colaborativa construída con React e Leaflet sobre OpenStreetMap.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![i18next](https://img.shields.io/badge/i18next-26.0-26A69A?style=flat-square)](https://www.i18next.com)
[![Licenza](https://img.shields.io/badge/licenza-GPL--3.0-blue?style=flat-square)](LICENSE)

---

## Sobre a aplicación

Explora Map é unha plataforma de mapas colaborativos de software libre que permite crear, compartir e explorar mapas personalizados sobre OpenStreetMap. Calquera persoa pode visualizar e explorar os mapas públicos sen rexistro. As persoas usuarias autenticadas poden crear os seus propios mapas, engadir marcadores con categorías, convidar membros e xestionar o acceso. O proxecto segue un principio de *privacy by design*: non se usan trackers de terceiros, os tokens de autenticación non se persisten en `localStorage` e o token de refresco vive exclusivamente nunha cookie `HttpOnly`. A aplicación está despregada en [https://explora-mapa.eu](https://explora-mapa.eu).

---

## Stack tecnolóxico

### Dependencias de produción

- `react` ^19.2.4: Biblioteca de UI
- `react-dom` ^19.2.4: Renderizado no DOM
- `react-router-dom` ^7.13.1: Enrutamento SPA
- `leaflet` ^1.9.4: Motor de mapas interactivos
- `leaflet-routing-machine` ^3.2.12: Cálculo e visualización de rutas
- `axios` ^1.13.6: Cliente HTTP con interceptores
- `zustand` ^5.0.12: Estado global lixeiro
- `i18next` ^26.0.10: Núcleo de internacionalización
- `i18next-browser-languagedetector` ^8.2.1: Detección automática do idioma do navegador
- `i18next-http-backend` ^4.0.0: Carga lazy de ficheiros de tradución
- `react-i18next` ^17.0.7: Integración de i18next con React
- `@fontsource/inter` ^5.2.8: Tipografía Inter (interface)
- `@fontsource/jetbrains-mono` ^5.2.8: Tipografía monoespazada

### Dependencias de desenvolvemento

- `vite` ^8.0.1: Build tool e servidor de desenvolvemento
- `@vitejs/plugin-react` ^6.0.1: Plugin React para Vite (Fast Refresh)
- `vitest` ^4.1.7: Test runner
- `eslint` ^9.39.4: Linter
- `eslint-plugin-react-hooks` ^7.0.1: Regras de linting para hooks
- `eslint-plugin-react-refresh` ^0.5.2: Regras de linting para Fast Refresh

### APIs externas (sen paquete npm)

- [Nominatim](https://nominatim.openstreetmap.org): Xeolocalización inversa e busca de lugares por nome
- [Open-Meteo](https://open-meteo.com): Datos meteorolóxicos en tempo real
- [OSRM](https://router.project-osrm.org): Cálculo de rutas e distancias
- [OpenStreetMap tiles](https://tile.openstreetmap.org): Teselas base do mapa

---

## Estrutura de cartafoles

```
frontend/
├── public/
│   ├── locales/                  # Ficheiros de tradución (gl/, en/)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── images/               # Imaxes e recursos estáticos
│   │   └── styles/               # CSS plano con custom properties (un ficheiro por ámbito)
│   ├── components/               # Compoñentes reutilizables (layout, UI, mapa)
│   ├── hooks/                    # Hooks personalizados
│   ├── pages/                    # Páxinas (un compoñente por ruta)
│   ├── services/                 # Funcións de chamada á API REST
│   ├── store/                    # Estado global: Zustand stores + AuthContext
│   ├── test/
│   │   └── __tests__/            # Tests unitarios con Vitest
│   ├── App.jsx                   # Definición de todas as rutas
│   ├── i18n.js                   # Configuración de i18next
│   └── main.jsx                  # Punto de entrada, imports globais de CSS e fontes
├── index.html
├── package.json
└── vite.config.js
```

---

## Instalación e desenvolvemento local

```bash
# Clonar
git clone https://github.com/explora-map/frontend.git
cd frontend

# Instalar dependencias
npm install

# Crear ficheiro de variables de entorno
# Crear .env.local coa seguinte variable:
#   VITE_API_URL=http://localhost:8080

# Arrincar en modo desenvolvemento
npm run dev
```

A variable `VITE_API_URL` configura a URL base da API en `src/services/axiosInstance.js`. O backend debe estar dispoñible nesa URL antes de arrancar o frontend. Para desenvolvemento local, o valor habitual é `http://localhost:8080`.

### Scripts dispoñibles

- `npm run dev`: Servidor de desenvolvemento con Hot Module Replacement
- `npm run build`: Compilación optimizada para produción
- `npm run preview`: Previsualización do build de produción en local
- `npm run lint`: Análise estática con ESLint
- `npm run test`: Execución dos tests unitarios con Vitest

---

## Arquitectura e decisións de deseño

### Estado global con Zustand e AuthContext

O estado global divídese en cinco stores Zustand independentes segundo o dominio, máis un React Context para a autenticación:

- **`useIdiomaStore`**: idioma activo; sincroniza con i18next e persiste en `localStorage` coa clave `explora-idioma`. Pode propagarse ao backend ao cambiar nas preferencias de perfil.
- **`useMapaVisualStore`**: estado de visualización do mapa principal: que mapas e categorías están activos, marcadores cargados por mapa, e coordenadas actuais. Estado en memoria: resétase ao recargar a páxina.
- **`useNotificacionStore`**: lista de notificacións da usuaria (convites recibidos, cambios en mapas) con conteo de non lidas. Estado en memoria.
- **`useSidebarStore`**: estado expandido/colapsado do panel lateral; persiste en `sessionStorage` para sobrevivir a navegacións dentro da sesión pero non entre pestanas nin ao pechar o navegador.
- **`useTemaStore`**: tema claro/escuro; aplica o atributo `data-theme` no elemento `<html>` e persiste en `localStorage`.
- **`AuthContext`**: xestiona `isAuthenticated`, `username` e `tokenExpiration`. Úsase React Context en lugar de Zustand porque os guards de ruta (`ProtectedRoute`) deben consumir este estado dentro da árbore de React, e porque o contexto facilita o patrón de recuperación silenciosa de sesión no `mount` do provider.

### Almacenamento de tokens JWT en memoria de módulo

O token de acceso gárdase nunha variable de módulo (`let _accessToken`) en `src/services/axiosInstance.js`, non en `localStorage`. `localStorage` é accesible por calquera JavaScript que execute na páxina, incluídos scripts de terceiros e payloads XSS; un atacante podería exfiltrar o token e todos os accesos á API de forma persistente. En memoria de módulo, o token só é accesible ao código propio da aplicación e desaparece ao recargar a páxina.

O token de refresco vive nunha cookie `HttpOnly`, `Secure`, `SameSite=Strict` xestionada polo servidor: JavaScript non pode acceder a ela en ningún caso. Ao recargar, `AuthProvider` chama a `/renovar` en `mount`; a cookie envíase automaticamente e a sesión recupérase de forma silenciosa antes de que `ProtectedRoute` poida redirixir a `/login`.

O interceptor de resposta en `axiosInstance.js` xestiona os 401 con un único intento de refresco, evitando chamadas simultáneas mediante un flag `isRefreshing` e unha cola de promesas pendentes.

### Patrón de protección contra dobre fetch en StrictMode

React 18+ en `StrictMode` monta os efectos dúas veces en desenvolvemento. Os compoñentes que realizan fetches na montaxe usan un `useRef` como flag de control ou `AbortController` para cancelar a chamada redundante e evitar actualizacións de estado sobre compoñentes desmontados.

### CSS plano con custom properties

Non se usa Tailwind, CSS Modules nin ningún framework de estilos. Cada ámbito funcional ten o seu propio ficheiro CSS en `src/assets/styles/`, todos importados globalmente desde `main.jsx`. O theming claro/escuro xestiónase con custom properties CSS definidas en `global.css` e activadas polo atributo `data-theme` no elemento raíz, que `useTemaStore` escribe directamente.

### Internacionalización con galego por defecto

i18next configúrase con `fallbackLng: 'gl'` e `supportedLngs: ['gl', 'en']`. A detección de idioma consulta primeiro `localStorage` (clave `explora-idioma`) e despois as preferencias do navegador. Os ficheiros de tradución cárganse de forma lazy desde `public/locales/{{lng}}/translation.json` mediante `i18next-http-backend`. A aplicación usa `<Suspense>` no punto de entrada para agardar a carga inicial das traducións antes de renderizar.

---

## Rutas

- `/login`: `LoginPage`: Pública (sen layout)
- `/rexistro`: `RegisterPage`: Pública (sen layout)
- `/verificar`: `VerificarPage`: Pública (sen layout)
- `/`: `MapaPrincipalPage`: Pública (con Sidebar)
- `/explorar`: `ExplorarMapasPage`: Pública (con Sidebar)
- `/mapas`: `MapaListPage`: Protexida
- `/mapas/novo`: `MapaCrearPage`: Protexida
- `/mapas/:id`: `MapaDetallePage`: Protexida
- `/mapas/:id/editar`: `MapaEditarPage`: Protexida
- `/convites`: `ConvitesPage`: Protexida
- `/configuracion`: `ConfiguracionPage`: Protexida
- `/perfil`: `PerfilPage`: Protexida
- `*`: Redirixe a `/`

As rutas protexidas están agrupadas baixo `<ProtectedRoute>`, que renderiza `<Outlet />` se `isAuthenticated` é `true` ou redirixe a `/login` en caso contrario. As rutas públicas `/` e `/explorar` comparten `<AppLayout>` co Sidebar, o panel `<VisualizarMapasPanel>` e o compoñente `<Notificacions>`.

---

## Repositorios relacionados

- [explora-map/backend](https://github.com/explora-map/backend): API REST en Spring Boot
- [explora-map/docs](https://github.com/explora-map/docs)
- [explora-map/deploy](https://github.com/explora-map/deploy)

---

## Licenza

Este proxecto distribúese baixo os termos da [GNU General Public License v3.0](LICENSE).