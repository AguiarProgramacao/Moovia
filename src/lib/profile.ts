import type { User } from "@supabase/supabase-js";

export function profileFor(user: User | null) {
  const fullName: unknown = user?.user_metadata?.full_name;
  const name =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim()
      : user?.email?.split("@")[0] || "Minha conta";
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("pt-BR");
  return { name, initials, email: user?.email ?? "" };
}
