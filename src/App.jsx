import { PlantProvider, usePlant } from './context/PlantContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function Pantalla() {
  const { jefe } = usePlant();
  return jefe ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <PlantProvider>
      <Pantalla />
    </PlantProvider>
  );
}
