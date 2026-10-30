import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  requireSupabase,
  supabase,
  supabaseConfigurationError,
} from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  initializationError: string | null;
  recoveryMode: boolean;
  finishRecovery: () => void;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "invalid_credentials") return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar.";
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  )
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (code === "weak_password")
    return "Escolha uma senha mais forte, conforme as regras da sua conta.";
  if (code === "same_password") return "Escolha uma senha diferente da atual.";
  if (code === "session_not_found" || code === "otp_expired")
    return "Sua sessão ou link expirou. Solicite um novo acesso.";
  return "Não foi possível concluir o acesso. Verifique sua conexão e tente novamente.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    supabaseConfigurationError,
  );
  const [recoveryMode, setRecoveryMode] = useState(
    () =>
      new URLSearchParams(location.search).get("recovery") === "1" ||
      location.hash.includes("type=recovery"),
  );
  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }
    let active = true;
    let receivedEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      receivedEvent = true;
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setInitializing(false);
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (!receivedEvent) setUser(data.session?.user ?? null);
        if (error)
          setInitializationError(
            "Sua sessão não pôde ser restaurada. Entre novamente.",
          );
        setInitializing(false);
      })
      .catch(() => {
        if (active) {
          setInitializationError("Não foi possível restaurar sua sessão.");
          setInitializing(false);
        }
      });
    // Remove obsolete demo flags; they never authorize real access.
    try {
      localStorage.removeItem("movvia-demo");
      sessionStorage.removeItem("movvia-demo");
    } catch {
      /* Optional storage. */
    }
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, remember: boolean) => {
    try {
      localStorage.setItem("movvia-remember", JSON.stringify(remember));
    } catch {
      /* Session storage fallback. */
    }
    const { data, error } = await requireSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    setInitializationError(null);
  };
  const signOut = async () => {
    const { error } = await requireSupabase().auth.signOut({ scope: "local" });
    if (error) throw error;
    setUser(null);
    setRecoveryMode(false);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        initializationError,
        recoveryMode,
        finishRecovery: () => setRecoveryMode(false),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider.");
  return context;
}
