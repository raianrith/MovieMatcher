-- Per-user match removal + rating + friend groups for group overlaps

-- 1) Add hide + rating to match_user_state
alter table public.match_user_state
  add column if not exists hidden boolean not null default false;

alter table public.match_user_state
  add column if not exists user_rating smallint null check (user_rating between 1 and 10);

create index if not exists mus_user_hidden_idx on public.match_user_state (user_id, hidden);

-- Backfill profiles for users created before the profile trigger existed.
-- Without this, FK inserts into friend_groups/friend_group_members can fail.
insert into public.profiles (id, username, display_name)
select
  u.id,
  lower(trim(coalesce(u.raw_user_meta_data->>'username', split_part(coalesce(u.email, ''), '@', 1)))) as username,
  trim(coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), split_part(coalesce(u.email, ''), '@', 1))) as display_name
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 2) Friend groups
create table if not exists public.friend_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists fgm_group_idx on public.friend_group_members (group_id);
create index if not exists fgm_user_idx on public.friend_group_members (user_id);

alter table public.friend_groups enable row level security;
alter table public.friend_group_members enable row level security;

-- Helper functions used by RLS (avoid cross-table recursion).
create or replace function public.is_group_owner(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_groups g
    where g.id = p_group_id
      and g.owner_id = p_user_id
  );
$$;

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_group_members m
    where m.group_id = p_group_id
      and m.user_id = p_user_id
  );
$$;

revoke all on function public.is_group_owner(uuid, uuid) from public;
revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

-- groups: owner can do anything; members can read
drop policy if exists fg_owner_all on public.friend_groups;
create policy fg_owner_all
  on public.friend_groups
  for all
  to authenticated
  using (public.is_group_owner(id, auth.uid()))
  with check (public.is_group_owner(id, auth.uid()));

drop policy if exists fg_member_read on public.friend_groups;
create policy fg_member_read
  on public.friend_groups
  for select
  to authenticated
  using (public.is_group_member(id, auth.uid()) or public.is_group_owner(id, auth.uid()));

-- members: owner can manage membership; members can read membership
drop policy if exists fgm_owner_all on public.friend_group_members;
create policy fgm_owner_all
  on public.friend_group_members
  for all
  to authenticated
  using (public.is_group_owner(group_id, auth.uid()))
  with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists fgm_member_read on public.friend_group_members;
create policy fgm_member_read
  on public.friend_group_members
  for select
  to authenticated
  using (public.is_group_member(group_id, auth.uid()) or public.is_group_owner(group_id, auth.uid()));

-- 3) RPC: group overlaps (everyone liked)
create or replace function public.group_overlaps(p_group_id uuid, p_media_type text default 'movie')
returns table (
  tmdb_movie_id integer,
  media_type text,
  movie_snapshot jsonb,
  liked_by_count integer
)
language sql
security definer
set search_path = public
as $$
  with members as (
    select user_id from public.friend_group_members where group_id = p_group_id
  ),
  member_count as (
    select count(*)::int as c from members
  ),
  liked as (
    select
      s.tmdb_movie_id,
      s.media_type,
      (jsonb_agg(s.movie_snapshot order by s.created_at desc))[1] as movie_snapshot,
      count(distinct s.user_id)::int as liked_by_count
    from public.swipes s
    join members m on m.user_id = s.user_id
    where s.action = 'liked'
      and s.media_type = p_media_type
    group by s.tmdb_movie_id, s.media_type
  )
  select l.tmdb_movie_id, l.media_type, l.movie_snapshot, l.liked_by_count
  from liked l, member_count mc
  where mc.c > 0 and l.liked_by_count = mc.c
  order by l.tmdb_movie_id asc;
$$;

revoke all on function public.group_overlaps(uuid, text) from public;
grant execute on function public.group_overlaps(uuid, text) to authenticated;

