import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  MonitorPlay,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";
import Brand from "../components/layout/Brand";
import { useStoredState } from "../hooks/useStoredState";
import Modal from "../components/ui/Modal";
import { authErrorMessage, useAuth } from "../contexts/AuthContext";
import { requireSupabase, supabaseConfigurationError } from "../lib/supabase";
export default function Login({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const [show, setShow] = useState(false),
    [loading, setLoading] = useState(false),
    [forgot, setForgot] = useState(false),
    [error, setError] = useState("");
  const [remember, setRemember] = useStoredState("movvia-remember", false);
  const { signIn, user, recoveryMode, finishRecovery, initializationError } =
    useAuth();
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const navigate = useNavigate();
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (recoveryMode && password.length < 6) {
      setError("Use uma senha com pelo menos 6 caracteres.");
      return;
    }
    if (recoveryMode && password !== String(data.get("confirmPassword"))) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (recoveryMode) {
        if (!user) {
          setError(
            "O link de recuperação expirou ou é inválido. Solicite um novo link.",
          );
          return;
        }
        const { error: updateError } = await requireSupabase().auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        finishRecovery();
      } else {
        await signIn(String(data.get("email")).trim(), password, remember);
      }
      navigate("/anuncios", { replace: true });
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };
  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetBusy(true);
    setResetError("");
    setResetMessage("");
    try {
      const { error: resetFailure } =
        await requireSupabase().auth.resetPasswordForEmail(resetEmail.trim(), {
          redirectTo: `${location.origin}/login?recovery=1`,
        });
      if (resetFailure) throw resetFailure;
      setResetMessage(
        "Se houver uma conta com este e-mail, você receberá as instruções para redefinir a senha.",
      );
    } catch (cause) {
      setResetError(authErrorMessage(cause));
    } finally {
      setResetBusy(false);
    }
  };
  return (
    <main className="login">
      <section className="login-story">
        <Brand />
        <span className="story-eyebrow">CONECTANDO MARCAS E CAMINHOS</span>
        <h1>
          Sua publicidade
          <br />
          em movimento<span>.</span>
        </h1>
        <p>
          Gerencie campanhas e transforme telas
          <br />
          em oportunidades de negócio.
        </p>
        <div className="city-art">
          <div className="route route-one" />
          <div className="route route-two" />
          <span className="map-pin">
            <MapPin size={24} />
          </span>
          <div className="screen-ad">
            <div className="screen-top">
              <span>movvia.</span>
              <span>● AO VIVO</span>
            </div>
            <strong>
              Sua marca.
              <br />
              Por toda
              <br />
              <em>a cidade.</em>
            </strong>
            <ArrowRight size={28} />
          </div>
          <span className="floating-label">
            <MonitorPlay size={20} />
            <span>
              Novos caminhos.
              <br />
              <b>Mais possibilidades.</b>
            </span>
          </span>
        </div>
        <div className="story-footer">
          <span>Publicidade que vai além.</span>
          <span>© 2026 Movvia</span>
        </div>
      </section>
      <section className="login-form-area">
        <button
          className="icon-button login-theme"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {dark ? <Sun /> : <Moon />}
        </button>
        <div className="login-form">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="eyebrow">BOM TER VOCÊ POR AQUI</span>
          <h2>{recoveryMode ? "Redefina sua senha" : "Bem-vindo de volta"}</h2>
          <p>
            {recoveryMode
              ? "Escolha uma nova senha para sua conta."
              : "Acesse seu workspace e coloque suas ideias em movimento."}
          </p>
          {initializationError && (
            <p className="error" role="alert">
              {initializationError}
            </p>
          )}
          <form onSubmit={submit}>
            {!recoveryMode && (
              <>
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="voce@empresa.com.br"
                  required
                  autoComplete="username"
                />
              </>
            )}
            <label htmlFor="password">
              {recoveryMode ? "Nova senha" : "Senha"}
            </label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                placeholder={
                  recoveryMode ? "No mínimo 6 caracteres" : "Sua senha"
                }
                required
                autoComplete={
                  recoveryMode ? "new-password" : "current-password"
                }
                aria-describedby={error ? "login-error" : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {recoveryMode && (
              <>
                <label htmlFor="confirmPassword">Confirme a nova senha</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  placeholder="Repita a nova senha"
                />
              </>
            )}
            {!recoveryMode && (
              <div className="form-options">
                <label>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Lembrar de mim{" "}
                  <span title="Mantém sua sessão neste navegador. Sua senha não é salva pela aplicação.">
                    ⓘ
                  </span>
                </label>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setResetMessage("");
                    setResetError("");
                    setForgot(true);
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}
            {error && (
              <p className="error" id="login-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary login-submit"
              disabled={loading || !!supabaseConfigurationError}
            >
              {loading ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  {recoveryMode ? "Salvando…" : "Entrando…"}
                </>
              ) : (
                <>
                  {recoveryMode ? "Salvar nova senha" : "Entrar"}{" "}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="demo-note">
            <span>SEU WORKSPACE MOVVIA</span>
            <p>
              Entre com sua conta cadastrada. Seu acesso e seus materiais são
              protegidos e vinculados à sua conta.
            </p>
          </div>
        </div>
        <span className="login-footer">
          Feito para marcas que querem ir mais longe.
        </span>
      </section>
      {forgot && (
        <Modal title="Recuperar senha" onClose={() => setForgot(false)}>
          <p>
            Informe o e-mail da sua conta para receber um link de recuperação.
          </p>
          <form onSubmit={requestReset}>
            <label htmlFor="reset-email">E-mail da conta</label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {resetError && (
              <p role="alert" className="error">
                {resetError}
              </p>
            )}
            {resetMessage && (
              <p role="status" className="success-message">
                {resetMessage}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="primary"
                disabled={resetBusy || !!supabaseConfigurationError}
              >
                {resetBusy ? "Enviando…" : "Enviar link"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
