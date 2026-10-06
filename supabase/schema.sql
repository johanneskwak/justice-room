-- Run once in a new Supabase project's SQL editor. No existing data is modified.
begin;
create table public.scenarios (
 id text primary key, code text unique not null, title text not null,
 prologue_script jsonb not null, final_venue text not null
);
create table public.escape_rooms (
 id text primary key, scenario_id text not null references public.scenarios(id),
 room_name text not null, background_tiles jsonb not null default '{}', is_locked boolean not null default false
);
create table public.clues_master (
 id text primary key, scenario_id text not null references public.scenarios(id),
 title text not null, description text not null, is_admissible boolean not null default true,
 synth_target_id text references public.clues_master(id) deferrable initially deferred
);
create table public.room_objects (
 id text primary key, room_id text not null references public.escape_rooms(id), name text not null,
 tile_x integer not null, tile_y integer not null,
 puzzle_type text not null check(puzzle_type in ('PASSCODE','ITEM_USE','INSPECT')),
 correct_key text, solved_clue_id text references public.clues_master(id)
);
create table public.trial_scripts (
 id text primary key, scenario_id text not null references public.scenarios(id),
 opponent_statement text not null, contradiction_clue_id text references public.clues_master(id),
 cutscene_url text check(cutscene_url is null or cutscene_url like 'https://%')
);
create table public.evidence_recipes (
 id text primary key, scenario_id text not null references public.scenarios(id),
 clue_a text not null references public.clues_master(id), clue_b text not null references public.clues_master(id),
 result_clue text not null references public.clues_master(id), check(clue_a <> clue_b)
);
create table public.game_sessions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check (jsonb_typeof(state)='object'), updated_at timestamptz not null default now()
);
create index escape_rooms_scenario on public.escape_rooms(scenario_id);
create index room_objects_room on public.room_objects(room_id);
create index clues_scenario on public.clues_master(scenario_id);
create index trial_scenario on public.trial_scripts(scenario_id);
create index recipes_scenario on public.evidence_recipes(scenario_id);
alter table public.scenarios enable row level security;
alter table public.escape_rooms enable row level security;
alter table public.room_objects enable row level security;
alter table public.clues_master enable row level security;
alter table public.trial_scripts enable row level security;
alter table public.evidence_recipes enable row level security;
alter table public.game_sessions enable row level security;
grant select on public.scenarios,public.escape_rooms,public.room_objects,public.clues_master,public.trial_scripts,public.evidence_recipes to anon,authenticated;
grant select,insert,update on public.game_sessions to authenticated;
revoke all on public.game_sessions from anon;
create policy "Read educational scenarios" on public.scenarios for select to anon,authenticated using(true);
create policy "Read educational rooms" on public.escape_rooms for select to anon,authenticated using(true);
create policy "Read educational objects" on public.room_objects for select to anon,authenticated using(true);
create policy "Read educational clues" on public.clues_master for select to anon,authenticated using(true);
create policy "Read educational trials" on public.trial_scripts for select to anon,authenticated using(true);
create policy "Read educational recipes" on public.evidence_recipes for select to anon,authenticated using(true);
create policy "Read own progress" on public.game_sessions for select to authenticated using((select auth.uid())=user_id);
create policy "Insert own progress" on public.game_sessions for insert to authenticated with check((select auth.uid())=user_id);
create policy "Update own progress" on public.game_sessions for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
commit;
