# Movie Match (social)

Mobile-first Next.js app: **email/password auth** (Supabase), **friends**, **TMDB-powered swipes**, **Postgres matches**, **realtime toasts**, **PWA**.

## Run locally

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_*, TMDB_API_KEY
npm install
npm run dev
```

## Supabase

1. Create a project. Enable **Email** auth (magic link optional; password is used by the UI).
2. In the SQL editor run [`supabase/migrations/20260205120000_movie_match_schema.sql`](supabase/migrations/20260205120000_movie_match_schema.sql).
   - If `alter publication supabase_realtime add table …` errors because a table is already in the publication, remove those lines and enable Realtime for `matches` + `friend_requests` in the dashboard instead.
3. **Profiles** rows are created automatically on signup via `handle_new_user()` (reads `username` + `display_name` from `signUp` metadata).

## TMDB

Create a [TMDB](https://www.themoviedb.org/settings/api) API v3 key as `TMDB_API_KEY` in `.env.local` (never `NEXT_PUBLIC_*`). The app pulls recommendations through:

- `GET /api/movies/feed` — discovery queue minus your swipes (auth required)
- `GET /api/movies/[id]` — single title hydrate (auth required)

## Routes

| Path        | Purpose                                      |
| ----------- | -------------------------------------------- |
| `/login`    | Email sign-in                                |
| `/signup`   | Register + profile metadata                  |
| `/dashboard`| Overview + deep links                      |
| `/swipe`    | Tinder-style cards (TMDB snapshots)        |
| `/friends`  | Search handles, send requests, remove friend |
| `/requests` | Accept / decline / block                     |
| `/matches`  | Filters, watchlist, watched per match row    |
| `/profile`  | Display name + avatar URL                    |
| `/settings` | Sign out                                     |

## Vercel

Set the same env vars. Add `NEXT_PUBLIC_SITE_URL` to your production hostname for metadata if you use it in `app/layout` later.

## PWA

- `app/manifest.ts` + generated icons (`npm run icons`)
- `components/RegisterSW.tsx` registers `/sw.js` in production

## Security model (summary)

- TMDB key stays on the server (`lib/tmdb.ts` + `app/api/movies/*`).
- RLS (see migration) scopes swipes, matches, friends, and match state to the signed-in user where required.
- Friendship removal uses `remove_friendship_with` (SECURITY DEFINER) so both directed edges disappear even though clients can normally delete only their own `friendships` rows.
