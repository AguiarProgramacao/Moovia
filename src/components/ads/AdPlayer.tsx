import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  X,
} from "lucide-react";
import type { Ad } from "../../types";

const IMAGE_DURATION_MS = 10_000;
const CONTROLS_HIDE_DELAY_MS = 3_500;

export default function AdPlayer({
  ads,
  initialIndex = 0,
  onClose,
}: {
  ads: Ad[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = ads[index];
  const showControls = useCallback(() => setControlsVisible(true), []);
  const next = useCallback(
    () => setIndex((value) => (value + 1) % ads.length),
    [ads.length],
  );
  const previous = useCallback(
    () => setIndex((value) => (value - 1 + ads.length) % ads.length),
    [ads.length],
  );

  useEffect(() => {
    if (!playing || current.type !== "image") return;
    const timer = window.setTimeout(next, IMAGE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [current.id, current.type, next, playing]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [current.id, playing]);
  useEffect(() => {
    if (!controlsVisible || !playing) return;
    const timer = window.setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [controlsVisible, index, playing]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      showControls();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
    };
    const onFullscreenChange = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [next, onClose, previous, showControls]);

  const close = async () => {
    if (document.fullscreenElement)
      await document.exitFullscreen().catch(() => undefined);
    onClose();
  };
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  return (
    <section
      className={`ad-player ${controlsVisible ? "controls-visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Reprodução dos anúncios"
      onClick={showControls}
    >
      <div className="ad-player-stage">
        {current.type === "video" ? (
          <video
            ref={videoRef}
            key={current.id}
            src={current.url}
            autoPlay
            playsInline
            onEnded={next}
            onError={next}
          />
        ) : (
          <img key={current.id} src={current.url} alt={current.name} />
        )}
      </div>
      <div
        className="ad-player-top"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ad-player-brand">
          movvia<span>.</span>
        </div>
        <div className="ad-player-count">
          {index + 1} / {ads.length}
        </div>
        <button
          className="ad-player-button"
          onClick={() => void close()}
          aria-label="Encerrar apresentação"
        >
          <X size={23} />
        </button>
      </div>
      <div
        className="ad-player-caption"
        onClick={(event) => event.stopPropagation()}
      >
        <strong>{current.name}</strong>
        <span>
          {current.type === "video" ? "Vídeo" : "Imagem · 10 segundos"}
        </span>
      </div>
      <div
        className="ad-player-controls"
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={previous} aria-label="Anúncio anterior">
          <ChevronLeft size={25} />
        </button>
        <button
          className="ad-player-play"
          onClick={() => {
            setPlaying((value) => !value);
            showControls();
          }}
          aria-label={
            playing ? "Pausar apresentação" : "Continuar apresentação"
          }
        >
          {playing ? (
            <Pause size={25} fill="currentColor" />
          ) : (
            <Play size={25} fill="currentColor" />
          )}
        </button>
        <button onClick={next} aria-label="Próximo anúncio">
          <ChevronRight size={25} />
        </button>
        <button
          onClick={() => void toggleFullscreen()}
          aria-label={
            fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"
          }
        >
          {fullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
        </button>
      </div>
      {current.type === "image" && playing && (
        <div className="ad-player-progress" key={current.id} />
      )}
    </section>
  );
}
