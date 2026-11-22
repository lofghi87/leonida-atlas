create index if not exists comments_user_id_idx on public.comments(user_id);
create index if not exists discoveries_user_id_idx on public.discoveries(user_id);
create index if not exists followers_followed_id_idx on public.followers(followed_id);
create index if not exists likes_user_id_idx on public.likes(user_id);
create index if not exists map_locations_created_by_idx on public.map_locations(created_by);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);

drop policy if exists "admins manage categories" on public.categories;
create policy "admins insert categories" on public.categories for insert to authenticated with check (public.is_admin());
create policy "admins update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete categories" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "admins manage locations" on public.map_locations;
create policy "admins insert locations" on public.map_locations for insert to authenticated with check (public.is_admin());
create policy "admins update locations" on public.map_locations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete locations" on public.map_locations for delete to authenticated using (public.is_admin());