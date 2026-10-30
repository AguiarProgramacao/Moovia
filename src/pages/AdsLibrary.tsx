import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Search,
  Moon,
  Sun,
  Plus,
  FolderPlus,
  LayoutGrid,
  List,
  ChevronRight,
  Folder,
  Image,
  Film,
  MoreHorizontal,
  ArrowUpRight,
  X,
  Menu,
  SlidersHorizontal,
  Upload,
  Check,
  Images,
  LoaderCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import Modal from "../components/ui/Modal";
import Artwork from "../components/ads/Artwork";
import { useStoredState } from "../hooks/useStoredState";
import { useLibrary } from "../hooks/useLibrary";
import { useAuth } from "../contexts/AuthContext";
import { profileFor } from "../lib/profile";
import { MEDIA_ACCEPT } from "../services/mediaRepository";
import type { Ad } from "../types";
import AdPlayer from "../components/ads/AdPlayer";
export default function AdsLibrary({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const {
    folders,
    ads,
    loading,
    busy,
    error,
    warning,
    refresh,
    createFolder: saveFolder,
    uploadFiles,
    removeAd,
  } = useLibrary();
  const { user } = useAuth();
  const profile = profileFor(user);
  const [folderId, setFolderId] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("newest"),
    [view, setView] = useStoredState<"grid" | "list">("movvia-view", "grid");
  const [preview, setPreview] = useState<Ad | null>(null),
    [newFolder, setNewFolder] = useState(false),
    [folderName, setFolderName] = useState(""),
    [folderError, setFolderError] = useState(""),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState<string | null>(null),
    [deleting, setDeleting] = useState<Ad | null>(null),
    [deleteError, setDeleteError] = useState(""),
    [presentationAds, setPresentationAds] = useState<Ad[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);
  const currentFolder = folders.find((f) => f.id === folderId);
  const filtered = ads
    .filter(
      (ad) =>
        (!folderId || ad.folderId === folderId) &&
        ad.name
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")) &&
        (type === "all" || ad.type === type),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "pt-BR")
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  const createFolder = async (e: FormEvent) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) {
      setFolderError("Informe um nome para a pasta.");
      return;
    }
    if (
      folders.some(
        (f) => f.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setFolderError("Já existe uma pasta com esse nome.");
      return;
    }
    try {
      await saveFolder(name);
      setNewFolder(false);
      setFolderName("");
      setFolderError("");
      setNotice("Pasta salva na sua biblioteca.");
    } catch (cause) {
      setFolderError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a pasta.",
      );
    }
  };
  const addFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!selected.length) return;
    const destination =
      folderId ||
      folders.find((f) => f.systemKey === "own")?.id ||
      folders[0]?.id;
    if (!destination) {
      setNotice("Crie uma pasta antes de adicionar anúncios.");
      return;
    }
    try {
      const result = await uploadFiles(selected, destination);
      setNotice(
        [
          `${result.saved} de ${selected.length} arquivo(s) salvo(s) na biblioteca.`,
          ...result.failures,
        ].join(" "),
      );
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar os arquivos.",
      );
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      const cleanupWarning = await removeAd(deleting.id);
      setDeleting(null);
      setDeleteError("");
      setNotice(cleanupWarning ?? "Anúncio e arquivo excluídos da biblioteca.");
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o anúncio.",
      );
    }
  };
  const previewAd = preview
    ? (ads.find((ad) => ad.id === preview.id) ?? preview)
    : null;
  const playableAds = filtered.filter((ad) => ad.url && !ad.unavailable);
  const startPresentation = async () => {
    if (!playableAds.length) {
      setNotice("Não há anúncios com prévia disponível para reproduzir.");
      return;
    }
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
    setPresentationAds([...playableAds]);
  };
  const date = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return (
    <div className="app-shell">
      <Sidebar open={mobile} close={() => setMobile(false)} />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-path">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Anúncios</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">
              <span />
              Conta conectada
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="avatar" title={profile.name}>
              {profile.initials}
            </span>
          </div>
        </header>
        <main className="library">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SEU CONTEÚDO, EM MOVIMENTO</div>
              <h1>
                Biblioteca de Anúncios<span>.</span>
              </h1>
              <p>
                Organize e visualize os materiais publicitários da sua rede.
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary presentation-button"
                disabled={busy || loading || !!error || !ads.length}
                onClick={() => void startPresentation()}
              >
                <Play size={17} fill="currentColor" />
                Reproduzir anúncios
              </button>
              <button
                className="secondary"
                disabled={busy || loading || !!error}
                onClick={() => {
                  setNewFolder(true);
                  setFolderError("");
                }}
              >
                <FolderPlus size={17} />
                Nova Pasta
              </button>
              <button
                className="primary"
                disabled={busy || loading || !!error}
                onClick={() => fileInput.current?.click()}
              >
                {busy ? (
                  <LoaderCircle size={19} className="spin" />
                ) : (
                  <Plus size={19} />
                )}
                {busy ? "Salvando…" : "Adicionar Anúncio"}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept={MEDIA_ACCEPT}
                multiple
                hidden
                onChange={addFiles}
              />
            </div>
          </div>
          <section className="library-banner">
            <span className="banner-icon">
              <Images size={26} />
            </span>
            <div>
              <strong>Uma biblioteca. Infinitas possibilidades.</strong>
              <p>
                Todos os seus criativos organizados, prontos para ganhar as
                ruas.
              </p>
            </div>
            <div className="banner-art">
              <span />
              <span />
              <span />
            </div>
            <span className="banner-tag">
              ESPAÇO PARA SUAS IDEIAS <ArrowUpRight size={15} />
            </span>
          </section>
          {notice && (
            <div className="notice" role="status">
              <Check size={18} />
              <span>{notice}</span>
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="Dispensar mensagem"
              >
                <X size={17} />
              </button>
            </div>
          )}
          {warning && (
            <div className="notice warning" role="status">
              <AlertCircle size={18} />
              <span>{warning}</span>
              <button
                className="secondary"
                disabled={busy || loading}
                onClick={() => void refresh()}
              >
                Recarregar prévias
              </button>
            </div>
          )}
          <div className="breadcrumb">
            <button
              onClick={() => setFolderId("")}
              className={!folderId ? "selected" : ""}
            >
              <Folder size={15} />
              Todos os arquivos
            </button>
            {currentFolder && (
              <>
                <ChevronRight size={14} />
                <span>{currentFolder.name}</span>
              </>
            )}
          </div>
          {!folderId && (
            <section className="folders-section">
              <div className="section-heading">
                <h2>
                  Pastas{" "}
                  <span>{folders.length.toString().padStart(2, "0")}</span>
                </h2>
                <span>Um lugar para cada ideia</span>
              </div>
              <div className="folders-grid">
                {folders.map((folder) => (
                  <button
                    className="folder-card"
                    key={folder.id}
                    onClick={() => setFolderId(folder.id)}
                  >
                    <span className={`folder-symbol ${folder.color}`}>
                      <Folder size={33} fill="currentColor" strokeWidth={1.3} />
                    </span>
                    <ArrowUpRight size={15} className="folder-arrow" />
                    <strong>{folder.name}</strong>
                    <span>
                      {ads.filter((a) => a.folderId === folder.id).length}{" "}
                      anúncios
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <div className="section-heading files-heading">
              <h2>
                {currentFolder ? "Anúncios da pasta" : "Todos os anúncios"}{" "}
                <span>{filtered.length.toString().padStart(2, "0")}</span>
              </h2>
              <span>Seu acervo de possibilidades</span>
            </div>
            <div className="toolbar">
              <label className="search">
                <Search size={18} />
                <input
                  aria-label="Buscar anúncios por nome"
                  placeholder="Buscar anúncios pelo nome..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    className="icon-button"
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <div className="filters">
                <label className="select-wrap">
                  <SlidersHorizontal size={15} />
                  <select
                    aria-label="Filtrar tipo de arquivo"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="image">Imagens</option>
                    <option value="video">Vídeos</option>
                  </select>
                </label>
                <label className="select-wrap sort">
                  <select
                    aria-label="Ordenar anúncios"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="name">Nome: A a Z</option>
                  </select>
                </label>
                <div className="view-toggle">
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Visualização em grade"
                    aria-pressed={view === "grid"}
                    className={view === "grid" ? "chosen" : ""}
                  >
                    <LayoutGrid size={17} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    aria-label="Visualização em lista"
                    aria-pressed={view === "list"}
                    className={view === "list" ? "chosen" : ""}
                  >
                    <List size={19} />
                  </button>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="empty-state" role="status">
                <LoaderCircle className="spin" size={28} />
                <p>Carregando sua biblioteca…</p>
              </div>
            ) : error ? (
              <div className="empty-state" role="alert">
                <AlertCircle size={30} />
                <h3>Não foi possível carregar a biblioteca</h3>
                <p>{error}</p>
                <button className="secondary" onClick={() => void refresh()}>
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length ? (
              <div className={`ads-${view}`}>
                {view === "list" && (
                  <div className="list-head">
                    <span>Nome do anúncio</span>
                    <span>Tipo</span>
                    <span>Incluído em</span>
                    <span>Tamanho</span>
                    <span />
                  </div>
                )}
                {filtered.map((ad) => (
                  <article className="ad-card" key={ad.id}>
                    <button
                      className="ad-preview"
                      onClick={() => setPreview(ad)}
                      aria-label={`Pré-visualizar ${ad.name}`}
                    >
                      <Artwork ad={ad} />
                      <span className="preview-overlay">
                        Visualizar <ArrowUpRight size={17} />
                      </span>
                      {ad.local && <span className="local-badge">LOCAL</span>}
                    </button>
                    <button className="ad-name" onClick={() => setPreview(ad)}>
                      <strong title={ad.name}>{ad.name}</strong>
                      <span>
                        {folders.find((f) => f.id === ad.folderId)?.name}
                      </span>
                    </button>
                    <span className="file-type">
                      {ad.type === "image" ? (
                        <Image size={13} />
                      ) : (
                        <Film size={13} />
                      )}
                      {ad.type === "image" ? "Imagem" : "Vídeo"}
                    </span>
                    <span className="ad-date">{date(ad.date)}</span>
                    <span className="ad-size">{ad.size}</span>
                    <div className="card-menu">
                      <button
                        className="icon-button"
                        aria-label={`Ações de ${ad.name}`}
                        aria-expanded={menu === ad.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenu(menu === ad.id ? null : ad.id);
                        }}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      {menu === ad.id && (
                        <div className="dropdown">
                          <button
                            onClick={() => {
                              setPreview(ad);
                              setMenu(null);
                            }}
                          >
                            Pré-visualizar
                          </button>
                          <button
                            onClick={() => {
                              setFolderId(ad.folderId);
                              setQuery("");
                              setType("all");
                              setMenu(null);
                            }}
                          >
                            Abrir pasta
                          </button>
                          {ad.storagePath && (
                            <button
                              disabled={busy}
                              onClick={() => {
                                setDeleting(ad);
                                setDeleteError("");
                                setMenu(null);
                              }}
                            >
                              Excluir anúncio
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>
                  <Images size={32} />
                </span>
                <h3>
                  {query || type !== "all"
                    ? "Nenhum anúncio encontrado"
                    : "Sua próxima ideia começa aqui"}
                </h3>
                <p>
                  {query || type !== "all"
                    ? "Experimente outro nome ou ajuste o filtro de arquivos."
                    : "Adicione uma imagem ou um vídeo para dar vida a esta pasta."}
                </p>
                {query || type !== "all" ? (
                  <button
                    className="secondary"
                    onClick={() => {
                      setQuery("");
                      setType("all");
                    }}
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <button
                    className="primary"
                    disabled={busy || loading || !!error}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Plus size={17} />
                    Adicionar Anúncio
                  </button>
                )}
              </div>
            )}
            <div className="library-footer">
              <span>
                {filtered.length} de{" "}
                {ads.filter((a) => !folderId || a.folderId === folderId).length}{" "}
                anúncios
              </span>
              <span>
                <Upload size={13} />
                Arquivos salvos na sua conta · Até 50 MB por arquivo
              </span>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              movvia<span className="blue">.</span>{" "}
              <span>Ideias que acompanham a cidade.</span>
            </span>
            <span>SEUS MATERIAIS, SEMPRE COM VOCÊ</span>
          </footer>
        </main>
      </div>
      {newFolder && (
        <Modal
          title="Nova pasta"
          onClose={() => {
            if (!busy) setNewFolder(false);
          }}
        >
          <p>Organize seus materiais em um novo espaço na biblioteca.</p>
          <form onSubmit={createFolder}>
            <label htmlFor="folder-name">Nome da pasta</label>
            <input
              id="folder-name"
              autoFocus
              maxLength={60}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ex.: Campanha de verão"
              required
              disabled={busy}
            />
            {folderError && (
              <p className="error" role="alert">
                {folderError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                disabled={busy}
                className="secondary"
                onClick={() => setNewFolder(false)}
              >
                Cancelar
              </button>
              <button className="primary" type="submit" disabled={busy}>
                <FolderPlus size={17} />
                {busy ? "Criando…" : "Criar pasta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Excluir anúncio"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            Excluir “{deleting.name}” da sua biblioteca e remover o arquivo
            armazenado? Essa ação não pode ser desfeita.
          </p>
          {deleteError && (
            <p className="error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              className="primary danger"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Excluindo…" : "Excluir anúncio"}
            </button>
          </div>
        </Modal>
      )}
      {previewAd && (
        <Modal title="Pré-visualização" wide onClose={() => setPreview(null)}>
          <div className="preview-media">
            {previewAd.url && previewAd.type === "video" ? (
              <video src={previewAd.url} controls autoPlay />
            ) : (
              <Artwork ad={previewAd} />
            )}
          </div>
          <h3>{previewAd.name}</h3>
          <div className="preview-details">
            <span>{previewAd.type === "image" ? "Imagem" : "Vídeo"}</span>
            <span>{previewAd.size}</span>
            <span>{date(previewAd.date)}</span>
          </div>
          <p className="preview-note">
            Arquivo privado, salvo na sua conta. A prévia tem acesso temporário
            e é renovada automaticamente.
          </p>
        </Modal>
      )}
      {presentationAds && (
        <AdPlayer
          ads={presentationAds}
          onClose={() => setPresentationAds(null)}
        />
      )}
    </div>
  );
}
