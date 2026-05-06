-- Add support for movies vs TV (and anime as TV preset) without ID collisions.

alter table public.swipes
  add column if not exists media_type text not null default 'movie' check (media_type in ('movie', 'tv'));

-- Update swipes uniqueness to include media_type
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'swipes_user_id_tmdb_movie_id_key'
  ) then
    alter table public.swipes drop constraint swipes_user_id_tmdb_movie_id_key;
  end if;
exception when undefined_object then
  null;
end $$;

create unique index if not exists swipes_user_media_tmdb_uidx
  on public.swipes (user_id, media_type, tmdb_movie_id);

create index if not exists swipes_media_tmdb_idx on public.swipes (media_type, tmdb_movie_id);

alter table public.matches
  add column if not exists media_type text not null default 'movie' check (media_type in ('movie', 'tv'));

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'matches_user_a_id_user_b_id_tmdb_movie_id_key'
  ) then
    alter table public.matches drop constraint matches_user_a_id_user_b_id_tmdb_movie_id_key;
  end if;
exception when undefined_object then
  null;
end $$;

create unique index if not exists matches_users_media_tmdb_uidx
  on public.matches (user_a_id, user_b_id, media_type, tmdb_movie_id);

create index if not exists matches_users_media_idx on public.matches (user_a_id, user_b_id, media_type);

-- Update match trigger to require same media_type
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
        and s.media_type = new.media_type
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
      insert into public.matches (user_a_id, user_b_id, media_type, tmdb_movie_id, movie_snapshot)
      values (a, b, new.media_type, new.tmdb_movie_id, new.movie_snapshot)
      on conflict (user_a_id, user_b_id, media_type, tmdb_movie_id) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

