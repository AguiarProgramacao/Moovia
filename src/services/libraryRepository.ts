import { requireSupabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type FolderRow = Database["public"]["Tables"]["folders"]["Row"];
export type AdRow = Database["public"]["Tables"]["ads"]["Row"];
type AdInsert = Database["public"]["Tables"]["ads"]["Insert"];

function repositoryError(error: { code?: string; message: string }): Error {
  if (error.code === "23505")
    return new Error("Já existe um registro com esse nome ou identificador.");
  if (error.code === "42501")
    return new Error(
      "Sua sessão não permite acessar estes dados. Entre novamente.",
    );
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST202"
  ) {
    return new Error(
      "A estrutura da biblioteca ainda não foi criada no Supabase. Aplique a migração do projeto.",
    );
  }
  return new Error(
    "Não foi possível concluir a operação no Supabase. Verifique a conexão e tente novamente.",
  );
}

async function authenticatedUserId() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error(
      "Entre com uma conta do Supabase para acessar a biblioteca.",
    );
  return data.user.id;
}

/** Real persistence only: failures never silently fall back to mock or local data. */
export const libraryRepository = {
  async load() {
    const client = requireSupabase();
    const userId = await authenticatedUserId();
    const { error: initializationError } =
      await client.rpc("initialize_library");
    if (initializationError) throw repositoryError(initializationError);

    const [folderResult, adResult] = await Promise.all([
      client
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at"),
      client
        .from("ads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (folderResult.error) throw repositoryError(folderResult.error);
    if (adResult.error) throw repositoryError(adResult.error);
    return { folders: folderResult.data, ads: adResult.data };
  },

  async createFolder(name: string): Promise<FolderRow> {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 60)
      throw new Error("Informe um nome de pasta com 1 a 60 caracteres.");
    const userId = await authenticatedUserId();
    const { data, error } = await requireSupabase()
      .from("folders")
      .insert({ user_id: userId, name: trimmedName, color: "blue" })
      .select()
      .single();
    if (error) throw repositoryError(error);
    return data;
  },

  async createAd(ad: Omit<AdInsert, "user_id" | "created_at">): Promise<AdRow> {
    const userId = await authenticatedUserId();
    const { data, error } = await requireSupabase()
      .from("ads")
      .insert({ ...ad, user_id: userId })
      .select()
      .single();
    if (error) throw repositoryError(error);
    return data;
  },

  async removeAd(id: string): Promise<void> {
    const userId = await authenticatedUserId();
    const { data, error } = await requireSupabase()
      .from("ads")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    if (error) throw repositoryError(error);
    if (!data.length)
      throw new Error("O anúncio não foi encontrado ou já foi removido.");
  },
};
