import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, X } from "lucide-react";
import QRCode from "qrcode";
import type { Ad } from "../../types";

const IMAGE_DURATION_MS = 10_000;
const CTA_DURATION_MS = 12_000;
const CONTROLS_HIDE_DELAY_MS = 3_500;
type PlayerItem = { kind: "ad"; ad: Ad } | { kind: "cta"; id: string };

function buildPlaylist(ads: Ad[]): PlayerItem[] {
  const result: PlayerItem[] = [];
  ads.forEach((ad, index) => {
    result.push({ kind: "ad", ad });
    if ((index + 1) % 3 === 0) result.push({ kind: "cta", id: `cta-${index}` });
  });
  if (ads.length % 3 !== 0) result.push({ kind: "cta", id: "cta-last" });
  return result;
}

export default function AdPlayer({ ads, initialIndex = 0, onClose }: { ads: Ad[]; initialIndex?: number; onClose: () => void }) {
  const playlist = useMemo(() => buildPlaylist(ads), [ads]);
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [qrCode, setQrCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = playlist[index];
  const currentAd = current.kind === "ad" ? current.ad : null;
  const advertiseUrl = `${window.location.origin}/anuncie?origem=tela-do-veiculo`;
  const showControls = useCallback(() => setControlsVisible(true), []);
  const next = useCallback(() => setIndex((value) => (value + 1) % playlist.length), [playlist.length]);
  const previous = useCallback(() => setIndex((value) => (value - 1 + playlist.length) % playlist.length), [playlist.length]);

  useEffect(() => {
    if (!playing || currentAd?.type === "video") return;
    const timer = window.setTimeout(next, current.kind === "cta" ? CTA_DURATION_MS : IMAGE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [current, currentAd?.type, next, playing]);
  useEffect(() => {
    void QRCode.toDataURL(advertiseUrl, { width: 420, margin: 2, color: { dark: "#08111f", light: "#ffffff" } }).then(setQrCode);
  }, [advertiseUrl]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => setPlaying(false)); else video.pause();
  }, [current, playing]);
  useEffect(() => {
    if (!controlsVisible || !playing) return;
    const timer = window.setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [controlsVisible, index, playing]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      showControls();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
      if (event.key === " ") { event.preventDefault(); setPlaying((value) => !value); }
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
    };
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("fullscreenchange", onFullscreenChange); };
  }, [next, onClose, previous, showControls]);

  const close = async () => { if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined); onClose(); };
  const toggleFullscreen = async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); };

  return <section className={`ad-player ${controlsVisible ? "controls-visible" : ""}`} role="dialog" aria-modal="true" aria-label="Reprodução dos anúncios" onClick={showControls}>
    <div className="ad-player-stage">
      {current.kind === "cta" ? <div className="ad-player-cta">
        <div className="ad-player-cta-copy"><span>QUER VER SUA MARCA AQUI?</span><h2>Anuncie para quem<br />está em movimento.</h2><p>Aponte a câmera do celular, preencha seus dados e receba uma proposta.</p><strong>É rápido. Leva menos de 1 minuto.</strong></div>
        <div className="ad-player-qr">{qrCode && <img src={qrCode} alt="QR Code para anunciar" />}<strong>ESCANEIE PARA ANUNCIAR</strong><span>moovia-six.vercel.app/anuncie</span></div>
      </div> : current.ad.type === "video" ? <video ref={videoRef} key={current.ad.id} src={current.ad.url} autoPlay playsInline onEnded={next} onError={next} /> : <img key={current.ad.id} src={current.ad.url} alt={current.ad.name} />}
    </div>
    <div className="ad-player-top" onClick={(event) => event.stopPropagation()}><div className="ad-player-brand">movvia<span>.</span></div><div className="ad-player-count">{index + 1} / {playlist.length}</div><button className="ad-player-button" onClick={() => void close()} aria-label="Encerrar apresentação"><X size={23} /></button></div>
    <div className="ad-player-caption" onClick={(event) => event.stopPropagation()}><strong>{current.kind === "cta" ? "Anuncie aqui" : current.ad.name}</strong><span>{current.kind === "cta" ? "QR Code · 12 segundos" : current.ad.type === "video" ? "Vídeo" : "Imagem · 10 segundos"}</span></div>
    <div className="ad-player-controls" onClick={(event) => event.stopPropagation()}><button onClick={previous} aria-label="Anúncio anterior"><ChevronLeft size={25} /></button><button className="ad-player-play" onClick={() => { setPlaying((value) => !value); showControls(); }} aria-label={playing ? "Pausar apresentação" : "Continuar apresentação"}>{playing ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}</button><button onClick={next} aria-label="Próximo anúncio"><ChevronRight size={25} /></button><button onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}>{fullscreen ? <Minimize size={21} /> : <Maximize size={21} />}</button></div>
    {currentAd?.type !== "video" && playing && <div className={`ad-player-progress ${current.kind === "cta" ? "cta-progress" : ""}`} key={current.kind === "cta" ? current.id : current.ad.id} />}
  </section>;
}
