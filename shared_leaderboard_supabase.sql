create table if not exists public.drifty_leaderboard_records (
  record_key text primary key,
  scope text not null,
  level_index integer null,
  time_ms double precision not null check (time_ms >= 0),
  car_variant text not null,
  car_color text not null,
  deaths integer null check (deaths is null or deaths >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.drifty_leaderboard_records enable row level security;

drop policy if exists "drifty_leaderboard_read_all" on public.drifty_leaderboard_records;
create policy "drifty_leaderboard_read_all"
on public.drifty_leaderboard_records
for select
to anon
using (true);

drop policy if exists "drifty_leaderboard_block_direct_writes" on public.drifty_leaderboard_records;
create policy "drifty_leaderboard_block_direct_writes"
on public.drifty_leaderboard_records
for all
to anon
using (false)
with check (false);

create or replace function public.submit_drifty_leaderboard_record(
  p_record_key text,
  p_scope text,
  p_level_index integer,
  p_time_ms double precision,
  p_car_variant text,
  p_car_color text,
  p_deaths integer default null
)
returns public.drifty_leaderboard_records
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_record public.drifty_leaderboard_records;
  result_record public.drifty_leaderboard_records;
begin
  if p_record_key is null or p_scope is null or p_time_ms is null then
    raise exception 'record key, scope, and time are required';
  end if;

  select *
  into existing_record
  from public.drifty_leaderboard_records
  where record_key = p_record_key
  for update;

  if not found then
    insert into public.drifty_leaderboard_records (
      record_key,
      scope,
      level_index,
      time_ms,
      car_variant,
      car_color,
      deaths,
      updated_at
    )
    values (
      p_record_key,
      p_scope,
      p_level_index,
      p_time_ms,
      p_car_variant,
      p_car_color,
      p_deaths,
      timezone('utc', now())
    )
    returning * into result_record;
    return result_record;
  end if;

  if p_time_ms < existing_record.time_ms then
    update public.drifty_leaderboard_records
    set
      scope = p_scope,
      level_index = p_level_index,
      time_ms = p_time_ms,
      car_variant = p_car_variant,
      car_color = p_car_color,
      deaths = p_deaths,
      updated_at = timezone('utc', now())
    where record_key = p_record_key
    returning * into result_record;
    return result_record;
  end if;

  return existing_record;
end;
$$;

grant execute on function public.submit_drifty_leaderboard_record(
  text,
  text,
  integer,
  double precision,
  text,
  text,
  integer
) to anon;
