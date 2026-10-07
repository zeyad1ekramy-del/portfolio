create table projects(
  id uuid default gen_random_uuid() primary key,
  title text not null, description text, tags text,
  live_url text, code_url text, image_url text,
  is_desktop boolean default false,
  created_at timestamptz default now());
alter table projects enable row level security;
create policy "read" on projects for select using (true);
create policy "write" on projects for all to authenticated using (true) with check (true);

insert into storage.buckets (id,name,public) values ('project-images','project-images',true);
create policy "img read" on storage.objects for select using (bucket_id='project-images');
create policy "img write" on storage.objects for all to authenticated
  using (bucket_id='project-images') with check (bucket_id='project-images');
