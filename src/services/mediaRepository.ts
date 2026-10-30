import { requireSupabase } from "../lib/supabase";
import { libraryRepository, type AdRow } from "./libraryRepository";

export const MEDIA_BUCKET = "movvia-ad-media";
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
export const MEDIA_ACCEPT = Object.keys(extensions).join(",");
export const SIGNED_URL_LIFETIME = 3600;

export function validateFile(file: File) {
  if (!extensions[file.type])
    throw new Error(
      `${file.name}: formato não suportado. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM ou MOV.`,
    );
  if (!file.size || file.size > MAX_FILE_SIZE)
    throw new Error(`${file.name}: o arquivo deve ter entre 1 byte e 50 MB.`);
  if (file.name.length > 255)
    throw new Error("O nome do arquivo deve ter até 255 caracteres.");
}

export const mediaRepository = {
  async upload(file: File, folderId: string): Promise<AdRow> {
    validateFile(file);
    const client = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user)
      throw new Error(
        "Sua sessão expirou. Entre novamente para enviar arquivos.",
      );
    const id = crypto.randomUUID();
    const path = `${user.id}/${id}/original.${extensions[file.type]}`;
    const bucket = client.storage.from(MEDIA_BUCKET);
    const { error: uploadError } = await bucket.upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError)
      throw new Error(
        "Não foi possível enviar o arquivo. Verifique a conexão e a configuração do armazenamento.",
      );
    try {
      return await libraryRepository.createAd({
        id,
        folder_id: folderId,
        name: file.name,
        file_type: file.type.startsWith("video/") ? "video" : "image",
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: path,
      });
    } catch (cause) {
      // Storage and PostgreSQL have no shared transaction. Compensate a failed insert.
      const { error: cleanupError } = await bucket.remove([path]);
      if (cleanupError)
        throw new Error(
          "O anúncio não foi salvo e o arquivo enviado não pôde ser limpo. Verifique os arquivos pendentes no armazenamento antes de tentar novamente.",
        );
      throw cause;
    }
  },

  async signedUrls(paths: string[]) {
    const urls = new Map<string, string>();
    if (!paths.length) return urls;
    // Batch requests to keep larger libraries within API request limits.
    for (let index = 0; index < paths.length; index += 100) {
      const { data, error } = await requireSupabase()
        .storage.from(MEDIA_BUCKET)
        .createSignedUrls(paths.slice(index, index + 100), SIGNED_URL_LIFETIME);
      if (error)
        throw new Error(
          "Não foi possível carregar as prévias dos arquivos. Tente novamente.",
        );
      for (const item of data) {
        if (!item.error && item.path && item.signedUrl)
          urls.set(item.path, item.signedUrl);
      }
    }
    return urls;
  },

  async remove(ad: AdRow): Promise<string | null> {
    // Delete the visible database record first. A storage failure must not make the UI
    // pretend that the record still exists, or leave a record pointing at a deleted file.
    await libraryRepository.removeAd(ad.id);
    try {
      const { error } = await requireSupabase()
        .storage.from(MEDIA_BUCKET)
        .remove([ad.storage_path]);
      return error
        ? "Anúncio excluído da biblioteca. A limpeza do arquivo no armazenamento falhou; verifique os arquivos pendentes no Supabase."
        : null;
    } catch {
      return "Anúncio excluído da biblioteca. A limpeza do arquivo no armazenamento falhou; verifique os arquivos pendentes no Supabase.";
    }
  },
};
