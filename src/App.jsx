import { PlantProvider, usePlant } from './context/PlantContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PanelDocente from './components/PanelDocente';
import PanelEdFisica from './components/PanelEdFisica';
import AccesoDocente from './components/AccesoDocente';
import Cargando from './components/Cargando';
import ModoPantalla from './components/ModoPantalla';

function Aviso({ children }) {
  return <p className="p-8 text-lg font-semibold">{children}</p>;
}

function ErrorBanner({ mensaje }) {
  return (
    <p role="alert" className="fixed top-0 inset-x-0 z-50 bg-alarma text-white text-center font-semibold px-4 py-2">
      {mensaje}
    </p>
  );
}

// Vista para la pantalla del aula: se abre en /pantalla (el hosting ya manda todas las rutas a index.html)
const esModoPantalla = () => window.location.pathname.replace(/\/+$/, '') === '/pantalla';

function Pantalla() {
  const { jefe, authListo, esDocente, esDocenteEF, cuentaSinPermiso, logoutDocente, error } = usePlant();

  if (!authListo) return <Cargando />;
  if (esModoPantalla()) {
    return (
      <>
        {error && <ErrorBanner mensaje={error} />}
        <ModoPantalla />
      </>
    );
  }
  if (esDocente) return <PanelDocente />;
  if (esDocenteEF) return <PanelEdFisica />;
  if (cuentaSinPermiso) {
    return (
      <Aviso>
        Esta cuenta no tiene permisos de docente.{' '}
        <button onClick={logoutDocente} className="underline">Cerrar sesión</button>
      </Aviso>
    );
  }
  if (jefe) {
    return (
      <>
        {error && <ErrorBanner mensaje={error} />}
        <Dashboard />
      </>
    );
  }
  return (
    <>
      {error && <ErrorBanner mensaje={error} />}
      <Login />
      <AccesoDocente />
    </>
  );
}

export default function App() {
  return (
    <PlantProvider>
      <Pantalla />
    </PlantProvider>
  );
}