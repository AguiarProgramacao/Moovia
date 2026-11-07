create table if not exists public.advertising_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  company text not null check (char_length(company) between 2 and 120),
  whatsapp text not null check (char_length(whatsapp) between 8 and 30),
  city text not null check (char_length(city) between 2 and 100),
  message text check (message is null or char_length(message) <= 1000),
  source text not null default 'anuncie-aqui' check (char_length(source) <= 100),
  status text not null default 'novo' check (status in ('novo', 'contatado', 'fechado', 'arquivado')),
  created_at timestamptz not null default now()
);

alter table public.advertising_leads enable row level security;

create policy "public can submit advertising leads"
on public.advertising_leads for insert
to anon, authenticated
with check (status = 'novo');

create policy "authenticated users can read advertising leads"
on public.advertising_leads for select
to authenticated
using (true);

create policy "authenticated users can update advertising leads"
on public.advertising_leads for update
to authenticated
using (true)
with check (true);

grant insert on public.advertising_leads to anon, authenticated;
grant select, update on public.advertising_leads to authenticated;

create index if not exists advertising_leads_created_at_idx
on public.advertising_leads (created_at desc);
