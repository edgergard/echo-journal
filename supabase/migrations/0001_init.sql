-- Echo Journal schema. Every table is private to its user (RLS by auth.uid()).
create extension if not exists vector;

create type mood as enum ('rough', 'low', 'okay', 'good', 'great');
create type reflection_status as enum ('done', 'crisis', 'limit', 'error');

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 5000),
  mood mood not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index entries_user_created_idx on entries (user_id, created_at desc);

create table reflections (
  entry_id uuid primary key references entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status reflection_status not null,
  text text not null default '',
  -- RecalledRef[]: [{ "entryId", "date", "quote" }]
  recalled jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- openai/text-embedding-3-small → 1536 dimensions
create table entry_embeddings (
  entry_id uuid primary key references entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);
create index entry_embeddings_hnsw_idx
  on entry_embeddings using hnsw (embedding vector_cosine_ops);

create table ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  used integer not null default 0 check (used >= 0),
  primary key (user_id, day)
);

alter table entries enable row level security;
alter table reflections enable row level security;
alter table entry_embeddings enable row level security;
alter table ai_usage enable row level security;

create policy "own entries" on entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reflections" on reflections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own embeddings" on entry_embeddings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own usage" on ai_usage
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Most similar older entries of the calling user (cosine similarity).
create or replace function match_entries(
  query_embedding vector(1536),
  exclude_entry uuid,
  older_than timestamptz,
  match_count int default 3
)
returns table (entry_id uuid, similarity float)
language sql stable
security invoker
as $$
  select ee.entry_id, 1 - (ee.embedding <=> query_embedding) as similarity
  from entry_embeddings ee
  join entries e on e.id = ee.entry_id
  where ee.user_id = auth.uid()
    and ee.entry_id <> exclude_entry
    and e.created_at < older_than
  order by ee.embedding <=> query_embedding
  limit match_count;
$$;

-- Atomically uses one AI call for today; returns the new count, or null over the limit.
create or replace function consume_ai_usage(daily_limit int)
returns integer
language plpgsql
security invoker
as $$
declare
  new_used integer;
begin
  insert into ai_usage (user_id, day, used)
  values (auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
    do update set used = ai_usage.used + 1
    where ai_usage.used < daily_limit
  returning used into new_used;
  return new_used;
end;
$$;
