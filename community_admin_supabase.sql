create extension if not exists pgcrypto;

create table if not exists public.drifty_community_level_submissions (
  submission_id uuid primary key default gen_random_uuid(),
  level_name text not null,
  creator_name text not null,
  creator_time_ms double precision not null check (creator_time_ms >= 0),
  level_text text not null,
  start_angle double precision not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  review_note text null,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz null
);

create table if not exists public.drifty_community_levels (
  level_id uuid primary key default gen_random_uuid(),
  submission_id uuid null references public.drifty_community_level_submissions(submission_id) on delete set null,
  level_name text not null,
  creator_name text not null,
  creator_time_ms double precision not null check (creator_time_ms >= 0),
  level_text text not null,
  start_angle double precision not null default 0,
  leaderboard_json jsonb not null default '[]'::jsonb,
  approved_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.drifty_community_level_submissions enable row level security;
alter table public.drifty_community_levels enable row level security;

drop policy if exists "drifty_community_levels_read_all" on public.drifty_community_levels;
create policy "drifty_community_levels_read_all"
on public.drifty_community_levels
for select
to anon
using (true);

drop policy if exists "drifty_community_levels_block_direct_writes" on public.drifty_community_levels;
create policy "drifty_community_levels_block_direct_writes"
on public.drifty_community_levels
for all
to anon
using (false)
with check (false);

drop policy if exists "drifty_community_submissions_block_direct_access" on public.drifty_community_level_submissions;
create policy "drifty_community_submissions_block_direct_access"
on public.drifty_community_level_submissions
for all
to anon
using (false)
with check (false);

drop function if exists public.submit_drifty_community_level_submission(
  text,
  text,
  double precision,
  text,
  double precision
);

create or replace function public.submit_drifty_community_level_submission(
  p_level_name text,
  p_creator_name text,
  p_creator_time_ms double precision,
  p_level_text text,
  p_start_angle double precision default 0
)
returns public.drifty_community_level_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.drifty_community_level_submissions;
  normalized_level_name text;
  normalized_creator_name text;
begin
  if p_level_name is null or p_creator_time_ms is null or p_level_text is null then
    raise exception 'level name, creator time, and level text are required';
  end if;

  normalized_level_name := left(nullif(regexp_replace(btrim(p_level_name), '\s+', ' ', 'g'), ''), 40);
  normalized_creator_name := left(coalesce(nullif(regexp_replace(btrim(p_creator_name), '\s+', ' ', 'g'), ''), 'Player'), 10);

  if normalized_level_name is null then
    raise exception 'level name is required';
  end if;

  insert into public.drifty_community_level_submissions (
    level_name,
    creator_name,
    creator_time_ms,
    level_text,
    start_angle,
    status,
    submitted_at
  )
  values (
    normalized_level_name,
    normalized_creator_name,
    p_creator_time_ms,
    p_level_text,
    coalesce(p_start_angle, 0),
    'pending',
    timezone('utc', now())
  )
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.submit_drifty_community_level_submission(
  text,
  text,
  double precision,
  text,
  double precision
) to anon;

drop function if exists public.submit_drifty_community_level_run(
  uuid,
  text,
  double precision
);

create or replace function public.submit_drifty_community_level_run(
  p_level_id uuid,
  p_player_name text,
  p_time_ms double precision
)
returns public.drifty_community_levels
language plpgsql
security definer
set search_path = public
as $$
declare
  target_level public.drifty_community_levels;
  result_row public.drifty_community_levels;
  normalized_player_name text;
  next_leaderboard jsonb;
begin
  if p_level_id is null or p_time_ms is null then
    raise exception 'level id and time are required';
  end if;

  normalized_player_name := left(coalesce(nullif(regexp_replace(btrim(p_player_name), '\s+', ' ', 'g'), ''), 'Player'), 10);

  select *
  into target_level
  from public.drifty_community_levels
  where level_id = p_level_id
  for update;

  if not found then
    raise exception 'community level not found';
  end if;

  with combined_runs as (
    select normalized_player_name as player_name, p_time_ms as time_ms
    union all
    select existing.player_name, existing.time_ms
    from jsonb_to_recordset(coalesce(target_level.leaderboard_json, '[]'::jsonb)) as existing(player_name text, time_ms double precision)
  ),
  ranked_runs as (
    select player_name, time_ms
    from combined_runs
    where time_ms is not null
    order by time_ms asc, player_name asc
    limit 5
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'player_name', player_name,
        'time_ms', time_ms
      )
      order by time_ms asc, player_name asc
    ),
    '[]'::jsonb
  )
  into next_leaderboard
  from ranked_runs;

  update public.drifty_community_levels
  set
    leaderboard_json = next_leaderboard,
    updated_at = timezone('utc', now())
  where level_id = p_level_id
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.submit_drifty_community_level_run(
  uuid,
  text,
  double precision
) to anon;
