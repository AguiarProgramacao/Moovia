/** Database contract for the versioned SQL migrations in supabase/migrations. */
export type Database = {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          system_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          system_key?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      ads: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string;
          name: string;
          file_type: "image" | "video";
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id: string;
          name: string;
          file_type: "image" | "video";
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          folder_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ads_folder_owner_fkey";
            columns: ["folder_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      advertising_leads: {
        Row: {
          id: string;
          name: string;
          company: string;
          whatsapp: string;
          city: string;
          message: string | null;
          source: string;
          status: "novo" | "contatado" | "fechado" | "arquivado";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company: string;
          whatsapp: string;
          city: string;
          message?: string | null;
          source?: string;
          status?: "novo" | "contatado" | "fechado" | "arquivado";
          created_at?: string;
        };
        Update: {
          status?: "novo" | "contatado" | "fechado" | "arquivado";
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      initialize_library: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
