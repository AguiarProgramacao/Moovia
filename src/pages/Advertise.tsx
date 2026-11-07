import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Megaphone } from "lucide-react";
import Brand from "../components/layout/Brand";
import { submitAdvertisingLead } from "../services/leadRepository";

export default function Advertise() {
  const params = new URLSearchParams(window.location.search);
  const source = (params.get("origem") || "qr-code").slice(0, 100);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      setSent(true);
      setSending(false);
      return;
    }
    try {
      await submitAdvertisingLead({
        name: String(form.get("name") || "").trim(),
        company: String(form.get("company") || "").trim(),
        whatsapp: String(form.get("whatsapp") || "").trim(),
        city: String(form.get("city") || "").trim(),
        message: String(form.get("message") || "").trim() || null,
        source,
      });
      setSent(true);
    } catch {
      setError("Não foi possível enviar agora. Confira sua conexão e tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="advertise-page">
      <section className="advertise-intro">
        <Brand />
        <div className="advertise-icon"><Megaphone size={30} /></div>
        <p className="eyebrow">SUA MARCA EM MOVIMENTO</p>
        <h1>Anuncie para quem está circulando pela cidade.</h1>
        <p>Conte um pouco sobre sua empresa. Entraremos em contato pelo WhatsApp para explicar formatos, valores e disponibilidade.</p>
      </section>
      <section className="advertise-card">
        {sent ? (
          <div className="advertise-success" role="status">
            <CheckCircle2 size={52} />
            <h2>Recebemos seu interesse!</h2>
            <p>Seus dados chegaram à nossa equipe. Em breve falaremos com você pelo WhatsApp.</p>
          </div>
        ) : (
          <>
            <h2>Quero anunciar</h2>
            <p>Preencha os dados abaixo. Leva menos de um minuto.</p>
            <form onSubmit={submit}>
              <label>Seu nome<input name="name" maxLength={80} required autoComplete="name" placeholder="Como podemos chamar você?" /></label>
              <label>Empresa<input name="company" maxLength={120} required autoComplete="organization" placeholder="Nome da empresa" /></label>
              <div className="advertise-fields">
                <label>WhatsApp<input name="whatsapp" maxLength={30} required inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></label>
                <label>Cidade<input name="city" maxLength={100} required autoComplete="address-level2" placeholder="Sua cidade" /></label>
              </div>
              <label>O que você gostaria de anunciar? <span>(opcional)</span><textarea name="message" maxLength={1000} rows={4} placeholder="Conte rapidamente sobre seu negócio ou campanha" /></label>
              <input className="form-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {error && <p className="error" role="alert">{error}</p>}
              <button className="primary advertise-submit" disabled={sending}>
                {sending ? <LoaderCircle className="spin" size={19} /> : <Megaphone size={19} />}
                {sending ? "Enviando…" : "Quero receber uma proposta"}
              </button>
              <small>Ao enviar, você autoriza nosso contato pelo WhatsApp sobre publicidade.</small>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
