import {
  Images,
  Megaphone,
  CarFront,
  Monitor,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  LogOut,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { useState } from "react";
import { authErrorMessage, useAuth } from "../../contexts/AuthContext";
import { profileFor } from "../../lib/profile";
export default function Sidebar({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const profile = profileFor(user);
  const [leaving, setLeaving] = useState(false);
  const [exitError, setExitError] = useState("");
  return (
    <>
      <button
        className={`sidebar-overlay ${open ? "show" : ""}`}
        aria-label="Fechar menu"
        onClick={close}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Brand />
        <button
          className="mobile-close icon-button"
          onClick={close}
          aria-label="Fechar menu"
        >
          <X />
        </button>
        <div className="workspace">
          <span className="workspace-icon">M</span>
          <div>
            <strong>Meu workspace</strong>
            <small>Biblioteca pessoal</small>
          </div>
          <span className="workspace-status" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            { label: "Anúncios", icon: Images },
            { label: "Interessados", icon: Megaphone },
            { label: "Motoristas", icon: CarFront },
            { label: "Dispositivos", icon: Monitor },
            { label: "Relatórios", icon: ChartNoAxesCombined },
            { label: "Configurações", icon: Settings },
          ].map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              disabled={i > 1}
              className={`nav-item ${i === 0 ? "active" : ""}`}
              onClick={() => {
                if (i === 1) navigate("/interessados");
                close();
              }}
            >
              <Icon size={19} />
              {label}
              {i > 1 && <span>Em breve</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-spark">✧</span>
            <strong>
              Grandes ideias.
              <br />
              Novos caminhos.
            </strong>
            <p>
              Sua marca acompanha
              <br />a cidade em movimento.
            </p>
            <ArrowUpRight size={18} />
          </div>
          <button
            className="profile"
            disabled={leaving}
            onClick={async () => {
              setLeaving(true);
              setExitError("");
              try {
                await signOut();
                navigate("/login", { replace: true });
              } catch (cause) {
                setExitError(authErrorMessage(cause));
                setLeaving(false);
              }
            }}
            title="Sair da conta"
            aria-label={leaving ? "Saindo da conta" : "Sair da conta"}
          >
            <span className="avatar">{profile.initials}</span>
            <span>
              <strong>{leaving ? "Saindo…" : profile.name}</strong>
              <small title={profile.email}>{profile.email}</small>
            </span>
            <LogOut size={17} />
          </button>
          {exitError && (
            <p className="error" role="alert">
              {exitError}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
