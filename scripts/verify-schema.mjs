import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const readMigration = (name) =>
  readFileSync(
    new URL("../supabase/migrations/" + name, import.meta.url),
    "utf8",
  );
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log("PASS " + message);
};
async function fails(sql, code, message) {
  try {
    await db.exec(sql);
    throw new Error("Expected rejection: " + message);
  } catch (e) {
    if (e.code !== code) throw e;
    console.log("PASS " + message);
  }
}
try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth, public, storage to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
alter table storage.objects enable row level security;
grant select,insert,delete on storage.objects to authenticated,anon;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
  await db.exec(readMigration("202610290001_library.sql"));
  await db.exec(readMigration("202610290002_media_storage.sql"));
  console.log(
    "PASS migrations SQL (PostgreSQL/PGlite, Supabase auth/storage stubs)",
  );
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false); select public.initialize_library(); select public.initialize_library();`,
  );
  let result = await db.query("select * from public.folders");
  assert(result.rows.length === 4, "pastas iniciais idempotentes");
  const folderA = result.rows[0].id;
  await fails(
    `insert into public.folders(user_id,name) values('22222222-2222-4222-8222-222222222222','Intrusão')`,
    "42501",
    "RLS impede pasta em nome de outro usuário",
  );
  await fails(
    `insert into public.folders(user_id,name) values('11111111-1111-4111-8111-111111111111','minhas empresas')`,
    "23505",
    "unicidade de nome ignora maiúsculas",
  );
  await db.exec(
    `select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);`,
  );
  result = await db.query("select * from public.folders");
  assert(result.rows.length === 0, "RLS oculta pastas de outro usuário");
  await db.exec("select public.initialize_library()");
  await fails(
    `insert into public.ads(id,user_id,folder_id,name,file_type,mime_type,size_bytes,storage_path) values('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','${folderA}','cross.png','image','image/png',100,'22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/original.png')`,
    "23503",
    "FK impede anúncio em pasta de outro usuário",
  );
  const [{ id: folderB }] = (
    await db.query("select id from public.folders limit 1")
  ).rows;
  await db.exec(
    `insert into public.ads(id,user_id,folder_id,name,file_type,mime_type,size_bytes,storage_path) values('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','${folderB}','ad.png','image','image/png',100,'22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/original.png'); insert into storage.objects(bucket_id,name) values('movvia-ad-media','22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/original.png');`,
  );
  await db.exec(
    `select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`,
  );
  assert(
    (await db.query("select * from public.ads")).rows.length === 0,
    "RLS oculta anúncios de outro usuário",
  );
  assert(
    (await db.query("select * from storage.objects")).rows.length === 0,
    "RLS oculta arquivos de outro usuário",
  );
  await fails(
    `insert into storage.objects(bucket_id,name) values('movvia-ad-media','22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/original.png')`,
    "42501",
    "RLS impede upload no prefixo de outro usuário",
  );
  await db.exec(
    `delete from public.ads where id='33333333-3333-4333-8333-333333333333'; reset role;`,
  );
  assert(
    (await db.query("select * from public.ads")).rows.length === 1,
    "RLS impede exclusão de anúncio de outro usuário",
  );
  assert(
    (
      await db.query(
        `select public from storage.buckets where id='movvia-ad-media'`,
      )
    ).rows[0].public === false,
    "bucket privado",
  );
  await db.exec(`set role anon;`);
  await fails(
    "select * from public.folders",
    "42501",
    "anônimo não lê biblioteca",
  );
  await fails(
    "select public.initialize_library()",
    "42501",
    "anônimo não inicializa biblioteca",
  );
  assert(
    (await db.query("select * from storage.objects")).rows.length === 0,
    "anônimo não lê arquivos privados",
  );
} finally {
  await db.close();
}
