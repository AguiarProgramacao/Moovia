import { requireSupabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type AdvertisingLead =
  Database["public"]["Tables"]["advertising_leads"]["Row"];

export async function submitAdvertisingLead(
  lead: Database["public"]["Tables"]["advertising_leads"]["Insert"],
) {
  const { error } = await requireSupabase()
    .from("advertising_leads")
    .insert(lead);
  if (error) throw error;
}

export async function listAdvertisingLeads() {
  const { data, error } = await requireSupabase()
    .from("advertising_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(
  id: string,
  status: AdvertisingLead["status"],
) {
  const { error } = await requireSupabase()
    .from("advertising_leads")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
