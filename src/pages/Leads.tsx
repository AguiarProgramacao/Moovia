import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { listAdvertisingLeads, updateLeadStatus, type AdvertisingLead } from "../services/leadRepository";

const labels: Record<AdvertisingLead["status"], string> = {
  novo: "Novo", contatado: "Contatado", fechado: "Fechado", arquivado: "Arquivado",
};

export default function Leads() {
  const [leads, setLeads] = useState<AdvertisingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { setLeads(await listAdvertisingLeads()); }
    catch { setError("Não foi possível carregar os contatos."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const changeStatus = async (lead: AdvertisingLead, status: AdvertisingLead["status"]) => {
    await updateLeadStatus(lead.id, status);
    setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, status } : item));
  };
  return (
    <main className="leads-page">
      <header className="leads-header">
        <div><Link to="/anuncios"><ArrowLeft size={18} /> Voltar aos anúncios</Link><p className="eyebrow">OPORTUNIDADES</p><h1>Interessados em anunciar<span>.</span></h1><p>Contatos enviados pelo QR Code exibido no veículo.</p></div>
        <button className="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Atualizar</button>
      </header>
      {loading ? <div className="empty-state"><LoaderCircle className="spin" /><p>Carregando contatos…</p></div> : error ? <div className="empty-state"><p>{error}</p><button className="secondary" onClick={() => void load()}>Tentar novamente</button></div> : leads.length === 0 ? <div className="empty-state"><MessageCircle size={34} /><h2>Nenhum contato ainda</h2><p>Os formulários enviados pelo QR Code aparecerão aqui.</p></div> : <div className="leads-grid">{leads.map((lead) => {
        const digits = lead.whatsapp.replace(/\D/g, "");
        const phone = digits.startsWith("55") ? digits : `55${digits}`;
        return <article className="lead-card" key={lead.id}>
          <div className="lead-card-top"><span className={`lead-status ${lead.status}`}>{labels[lead.status]}</span><time>{new Date(lead.created_at).toLocaleString("pt-BR")}</time></div>
          <h2>{lead.company}</h2><strong>{lead.name}</strong><p>{lead.city}</p>
          {lead.message && <blockquote>{lead.message}</blockquote>}
          <div className="lead-actions"><a className="primary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Chamar no WhatsApp</a><select aria-label="Status do contato" value={lead.status} onChange={(e) => void changeStatus(lead, e.target.value as AdvertisingLead["status"])}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          <small>Origem: {lead.source}</small>
        </article>;
      })}</div>}
    </main>
  );
}
