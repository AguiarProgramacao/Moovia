import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useStoredState } from "./hooks/useStoredState";
import Login from "./pages/Login";
import AdsLibrary from "./pages/AdsLibrary";
import { useAuth } from "./contexts/AuthContext";
import { LoaderCircle } from "lucide-react";
import Advertise from "./pages/Advertise";
import Leads from "./pages/Leads";
export default function App() {
  const [dark, setDark] = useStoredState("movvia-dark", false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const { user, initializing, recoveryMode } = useAuth();
  const props = { dark, toggleTheme: () => setDark(!dark) };
  if (initializing)
    return (
      <main className="session-loading" role="status">
        <LoaderCircle size={25} className="spin" />
        Restaurando sua sessão…
      </main>
    );
  return (
    <Routes>
      <Route path="/anuncie" element={<Advertise />} />
      <Route
        path="/"
        element={
          <Navigate
            to={user && !recoveryMode ? "/anuncios" : "/login"}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={
          user && !recoveryMode ? (
            <Navigate to="/anuncios" replace />
          ) : (
            <Login {...props} />
          )
        }
      />
      <Route
        path="/anuncios"
        element={
          user && !recoveryMode ? (
            <AdsLibrary key={user.id} {...props} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/interessados" element={user && !recoveryMode ? <Leads /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
