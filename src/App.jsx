import { PlantProvider, usePlant } from './context/PlantContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PanelDocente from './components/PanelDocente';
import AccesoDocente from './components/AccesoDocente';

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

function Pantalla() {
  const { jefe, authListo, esDocente, cuentaSinPermiso, logoutDocente, error } = usePlant();

  if (!authListo) return <Aviso>{error || 'Conectando con la planta…'}</Aviso>;
  if (esDocente) return <PanelDocente />;
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
