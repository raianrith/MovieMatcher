-- Per-user match removal + rating + friend groups for group overlaps

-- 1) Add hide + rating to match_user_state
alter table public.match_user_state
  add column if not exists hidden boolean not null default false;

alter table public.match_user_state
  add column if not exists user_rating smallint null check (user_rating between 1 and 10);

create index if not exists mus_user_hidden_idx on public.match_user_state (user_id, hidden);

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

-- groups: owner can do anything; members can read
create policy fg_owner_all
  on public.friend_groups
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy fg_member_read
  on public.friend_groups
  for select
  to authenticated
  using (
    exists (
      select 1 from public.friend_group_members m
      where m.group_id = id and m.user_id = auth.uid()
    )
  );

-- members: owner can manage membership; members can read membership
create policy fgm_owner_all
  on public.friend_group_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.friend_groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.friend_groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  );

create policy fgm_member_read
  on public.friend_group_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.friend_group_members m
      where m.group_id = group_id and m.user_id = auth.uid()
    )
  );

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
      min(s.movie_snapshot) as movie_snapshot,
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

