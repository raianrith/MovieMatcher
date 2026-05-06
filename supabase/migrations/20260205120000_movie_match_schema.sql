-- Movie Match: profiles, friends, swipes (TMDB), matches, triggers, RLS
-- Drops legacy demo tables from earlier iterations.

drop table if exists public.swipes cascade;
drop table if exists public.room_members cascade;
drop table if exists public.rooms cascade;

drop function if exists public.reset_room_swipes(uuid);
drop function if exists public.get_room_id_by_invite(text);
drop function if exists public.peek_room_members(uuid);

create extension if not exists "pgcrypto";

-- ─── profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own_or_all
  on public.profiles for select
  to authenticated
  using (true);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Auto-create profile on signup (username + display_name in raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, ''), '@', 1)))),
    trim(coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── friend_requests ───────────────────────────────────────
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

alter table public.friend_requests enable row level security;

create policy fr_select_participants
  on public.friend_requests for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy fr_insert_as_sender
  on public.friend_requests for insert to authenticated
  with check (sender_id = auth.uid());

create policy fr_update_receiver
  on public.friend_requests for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

create or replace function public.touch_friend_request()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists tr_fr_touch on public.friend_requests;
create trigger tr_fr_touch before update on public.friend_requests
  for each row execute function public.touch_friend_request();

-- ─── friendships (both directions stored) ───────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

create policy friendships_select_own
  on public.friendships for select to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

create policy friendships_insert_own
  on public.friendships for insert to authenticated
  with check (user_id = auth.uid());

create policy friendships_delete_own
  on public.friendships for delete to authenticated
  using (user_id = auth.uid());

-- When a request is accepted, create symmetrical friendships (from app or trigger)
create or replace function public.on_friend_request_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'accepted' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'accepted' then return new; end if;

  insert into public.friendships (user_id, friend_id)
  values (new.sender_id, new.receiver_id)
  on conflict do nothing;
  insert into public.friendships (user_id, friend_id)
  values (new.receiver_id, new.sender_id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists tr_fr_accept on public.friend_requests;
create trigger tr_fr_accept
  after insert or update on public.friend_requests
  for each row execute function public.on_friend_request_accepted();

-- ─── swipes ────────────────────────────────────────────────
create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_movie_id integer not null,
  action text not null check (action in ('liked', 'disliked', 'skipped')),
  movie_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_movie_id)
);

create index if not exists swipes_user_id_idx on public.swipes (user_id);
create index if not exists swipes_tmdb_movie_id_idx on public.swipes (tmdb_movie_id);

alter table public.swipes enable row level security;

create policy swipes_select_own
  on public.swipes for select to authenticated
  using (user_id = auth.uid());

create policy swipes_insert_own
  on public.swipes for insert to authenticated
  with check (user_id = auth.uid());

create policy swipes_update_own
  on public.swipes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── matches (sorted user ids) ──────────────────────────────
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_movie_id integer not null,
  movie_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_a_id, user_b_id, tmdb_movie_id),
  check (user_a_id::text < user_b_id::text)
);

create index if not exists matches_users_idx on public.matches (user_a_id, user_b_id);

alter table public.matches enable row level security;

create policy matches_select_own
  on public.matches for select to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

-- ─── Match creation trigger ───────────────────────────────
create or replace function public.after_swipe_create_matches()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fid uuid;
  a uuid;
  b uuid;
begin
  if new.action <> 'liked' then
    return new;
  end if;

  for fid in select f.friend_id
    from public.friendships f
    where f.user_id = new.user_id
  loop
    if exists (
      select 1 from public.swipes s
      where s.user_id = fid
        and s.tmdb_movie_id = new.tmdb_movie_id
        and s.action = 'liked'
    ) then
      if new.user_id::text < fid::text then
        a := new.user_id;
        b := fid;
      else
        a := fid;
        b := new.user_id;
      end if;
      insert into public.matches (user_a_id, user_b_id, tmdb_movie_id, movie_snapshot)
      values (a, b, new.tmdb_movie_id, new.movie_snapshot)
      on conflict (user_a_id, user_b_id, tmdb_movie_id) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists tr_swipes_match on public.swipes;
create trigger tr_swipes_match
  after insert on public.swipes
  for each row execute function public.after_swipe_create_matches();

-- ─── Per-user flags on matches (watchlist / watched) ─────────
create table if not exists public.match_user_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  in_watchlist boolean not null default false,
  watched boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.match_user_state enable row level security;

create policy mus_select_own
  on public.match_user_state for select to authenticated
  using (user_id = auth.uid());

create policy mus_upsert_own
  on public.match_user_state for insert to authenticated
  with check (user_id = auth.uid());

create policy mus_update_own
  on public.match_user_state for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy mus_delete_own
  on public.match_user_state for delete to authenticated
  using (user_id = auth.uid());

-- Realtime for new matches / friend UX
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.friend_requests;

-- Bidirectional unlink (SECURITY DEFINER; RLS would block deleting the friend's row otherwise)
create or replace function public.remove_friendship_with(p_friend uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friendships
  where (user_id = auth.uid() and friend_id = p_friend)
     or (user_id = p_friend and friend_id = auth.uid());
end;
$$;

grant execute on function public.remove_friendship_with(uuid) to authenticated;
