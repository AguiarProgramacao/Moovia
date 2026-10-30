begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'movvia-ad-media', 'movvia-ad-media', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
        'video/mp4', 'video/webm', 'video/quicktime']
);

-- Objects use <authenticated-user-id>/<ad-id>/original.<extension>.
-- No public read, overwrite, or access to another user's prefix.
create policy movvia_media_read_own on storage.objects for select to authenticated
  using (bucket_id = 'movvia-ad-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy movvia_media_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'movvia-ad-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(string_to_array(name, '/'), 1) = 3
  );
create policy movvia_media_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'movvia-ad-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
