import {
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Orbit,
  Utensils,
  Bike,
} from "lucide-react";
import type { Ad } from "../../types";
import { ImageOff } from "lucide-react";
export default function Artwork({ ad }: { ad: Ad }) {
  if (ad.unavailable)
    return (
      <div className="media-unavailable">
        <ImageOff size={25} />
        <span>Prévia indisponível</span>
      </div>
    );
  if (ad.url)
    return ad.type === "video" ? (
      <video src={ad.url} preload="metadata" muted aria-label={ad.name} />
    ) : (
      <img src={ad.url} alt={ad.name} />
    );
  return (
    <div
      className={`artwork ${ad.design}`}
      aria-label={`Material demonstrativo: ${ad.name}`}
    >
      {ad.design === "pest" && (
        <>
          <span className="art-brand">
            <ShieldCheck size={18} /> P&F <small>DEDETIZADORA</small>
          </span>
          <strong>
            Proteção para
            <br />o que importa.
          </strong>
          <span className="art-bottom">
            Seu ambiente, livre de pragas. <ArrowUpRight size={18} />
          </span>
          <div className="art-ring" />
        </>
      )}
      {ad.design === "tech" && (
        <>
          <span className="art-brand">
            <Orbit size={20} /> polaris
          </span>
          <strong>
            Boas conexões.
            <br />
            <em>Infinitas possibilidades.</em>
          </strong>
          <span className="art-bottom">
            TECHNOLOGIES <ArrowUpRight size={18} />
          </span>
          <div className="orb" />
        </>
      )}
      {ad.design === "food" && (
        <>
          <span className="art-brand">
            <Utensils size={16} /> CASA & SABOR
          </span>
          <strong>
            Uma pausa.
            <br />
            Muito sabor.
          </strong>
          <span className="art-bottom">
            CONHEÇA NOSSO NOVO MENU <ArrowUpRight size={18} />
          </span>
          <div className="plate">🥗</div>
        </>
      )}
      {ad.design === "sale" && (
        <>
          <span className="art-brand">
            <Sparkles size={17} /> O MELHOR MOMENTO É AGORA
          </span>
          <strong>
            BLACK
            <br />
            <em>FRIDAY.</em>
          </strong>
          <span className="sale-sticker">
            ATÉ
            <br />
            <b>50%</b>
            <br />
            OFF
          </span>
          <span className="art-bottom">
            Ofertas que acompanham você. <ArrowUpRight size={18} />
          </span>
        </>
      )}
      {ad.design === "future" && (
        <>
          <span className="art-brand">
            <Orbit size={20} /> polaris
          </span>
          <strong>
            O futuro passa
            <br />
            por aqui<span>.</span>
          </strong>
          <span className="art-bottom">
            TECNOLOGIA QUE MOVE <ArrowUpRight size={18} />
          </span>
          <div className="future-grid" />
        </>
      )}
      {ad.design === "delivery" && (
        <>
          <span className="art-brand">
            <Utensils size={16} /> CASA & SABOR
          </span>
          <strong>
            Seu favorito.
            <br />
            Onde você estiver.
          </strong>
          <span className="art-bottom">
            PEÇA. RECEBA. APROVEITE. <Bike size={22} />
          </span>
          <div className="delivery-mark">↗</div>
        </>
      )}
    </div>
  );
}
