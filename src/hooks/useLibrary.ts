import { useCallback, useEffect, useRef, useState } from "react";
import type { Ad, Folder } from "../types";
import { libraryRepository, type AdRow } from "../services/libraryRepository";
import { mediaRepository, validateFile } from "../services/mediaRepository";

function toAd(row: AdRow, urls: Map<string, string>): Ad {
  return {
    id: row.id,
    name: row.name,
    type: row.file_type,
    folderId: row.folder_id,
    date: row.created_at.slice(0, 10),
    storagePath: row.storage_path,
    size: `${(row.size_bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} MB`,
    url: urls.get(row.storage_path),
    unavailable: !urls.has(row.storage_path),
  };
}

export function useLibrary() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const rows = useRef<AdRow[]>([]);
  const mounted = useRef(false);
  const mutationLock = useRef(false);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await libraryRepository.load();
      const urls = await mediaRepository.signedUrls(
        result.ads.map((ad) => ad.storage_path),
      );
      if (!mounted.current || version !== requestVersion.current) return;
      rows.current = result.ads;
      setFolders(
        result.folders.map((f) => ({
          id: f.id,
          name: f.name,
          color: f.color,
          systemKey: f.system_key ?? undefined,
        })),
      );
      setAds(result.ads.map((ad) => toAd(ad, urls)));
      setWarning(
        urls.size < result.ads.length
          ? "Algumas prévias estão indisponíveis. Tente recarregar ou verifique os arquivos no armazenamento."
          : "",
      );
    } catch (cause) {
      if (mounted.current && version === requestVersion.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar sua biblioteca.",
        );
    } finally {
      if (mounted.current && version === requestVersion.current)
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    // Signed URLs expire after one hour. Refresh them while the page remains open,
    // including after a sleeping tab resumes. No file URLs are persisted locally.
    const renew = async () => {
      const snapshot = rows.current;
      if (!snapshot.length || mutationLock.current) return;
      try {
        const urls = await mediaRepository.signedUrls(
          snapshot.map((ad) => ad.storage_path),
        );
        if (mounted.current && rows.current === snapshot) {
          setAds(snapshot.map((ad) => toAd(ad, urls)));
          setWarning(
            urls.size < snapshot.length
              ? "Algumas prévias estão indisponíveis. Tente recarregar a biblioteca."
              : "",
          );
        }
      } catch {
        if (mounted.current)
          setWarning(
            "Não foi possível renovar as prévias. Recarregue a biblioteca para tentar novamente.",
          );
      }
    };
    const interval = window.setInterval(() => void renew(), 50 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void renew();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted.current = false;
      requestVersion.current++;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const mutate = async <T>(operation: () => Promise<T>) => {
    if (mutationLock.current)
      throw new Error("Aguarde a operação atual terminar.");
    mutationLock.current = true;
    setBusy(true);
    try {
      return await operation();
    } finally {
      mutationLock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const createFolder = (name: string) =>
    mutate(async () => {
      const folder = await libraryRepository.createFolder(name);
      if (mounted.current)
        setFolders((prev) => [
          ...prev,
          { id: folder.id, name: folder.name, color: folder.color },
        ]);
    });
  const uploadFiles = (files: File[], folderId: string) =>
    mutate(async () => {
      // Validate the entire selection before uploading any file.
      files.forEach(validateFile);
      const failures: string[] = [];
      const uploaded: AdRow[] = [];
      for (const file of files) {
        try {
          uploaded.push(await mediaRepository.upload(file, folderId));
        } catch (cause) {
          failures.push(
            cause instanceof Error
              ? cause.message
              : `${file.name}: falha ao enviar.`,
          );
        }
      }
      if (uploaded.length) {
        rows.current = [...uploaded, ...rows.current];
        // Records are already saved even if generating a preview fails.
        let urls = new Map<string, string>();
        try {
          urls = await mediaRepository.signedUrls(
            uploaded.map((ad) => ad.storage_path),
          );
        } catch {
          failures.push(
            "Os arquivos foram salvos, mas as prévias não puderam ser carregadas.",
          );
        }
        if (mounted.current)
          setAds((prev) => [...uploaded.map((ad) => toAd(ad, urls)), ...prev]);
      }
      return { saved: uploaded.length, failures };
    });
  const removeAd = (id: string) =>
    mutate(async () => {
      const row = rows.current.find((ad) => ad.id === id);
      if (!row)
        throw new Error("Anúncio não encontrado. Recarregue sua biblioteca.");
      const cleanupWarning = await mediaRepository.remove(row);
      rows.current = rows.current.filter((ad) => ad.id !== id);
      if (mounted.current) setAds((prev) => prev.filter((ad) => ad.id !== id));
      return cleanupWarning;
    });
  return {
    folders,
    ads,
    loading,
    busy,
    error,
    warning,
    refresh,
    createFolder,
    uploadFiles,
    removeAd,
  };
}
