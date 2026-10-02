-- WhiskNote security hardening (run after 01_init.sql; safe to re-run)
-- Supabase Dashboard → SQL → New query → paste → Run

-- 1. Users must not be able to publish rows as "sample" recipes.
--    The "Anyone can read sample recipes" policy makes is_sample rows world-readable,
--    so letting clients set it would let any user broadcast content to every account.
--    Sample rows can still be created from the dashboard / service role.
drop policy if exists "Users can insert own recipes" on public.recipes;
create policy "Users can insert own recipes"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = user_id and is_sample = false);

drop policy if exists "Users can update own recipes" on public.recipes;
create policy "Users can update own recipes"
  on public.recipes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and is_sample = false);

-- 2. Size limits so a single client can't store unbounded data.
--    NOT VALID = enforced for new writes only; existing rows are left untouched.
alter table public.recipes drop constraint if exists recipes_title_len;
alter table public.recipes add constraint recipes_title_len
  check (char_length(title) between 1 and 200) not valid;

alter table public.recipes drop constraint if exists recipes_text_len;
alter table public.recipes add constraint recipes_text_len
  check (
    coalesce(char_length(description), 0) <= 2000
    and coalesce(char_length(notes), 0) <= 5000
    and coalesce(char_length(servings_label), 0) <= 100
    and char_length(category) <= 50
    and coalesce(char_length(difficulty), 0) <= 50
  ) not valid;

-- Photos are stored as compressed data URLs (~100–400 KB); cap at ~3 MB.
alter table public.recipes drop constraint if exists recipes_image_url_len;
alter table public.recipes add constraint recipes_image_url_len
  check (image_url is null or octet_length(image_url) <= 3000000) not valid;

alter table public.recipes drop constraint if exists recipes_json_size;
alter table public.recipes add constraint recipes_json_size
  check (
    pg_column_size(ingredients) <= 200000
    and pg_column_size(instructions) <= 500000
    and jsonb_typeof(ingredients) = 'array'
    and jsonb_typeof(instructions) = 'array'
  ) not valid;

alter table public.recipes drop constraint if exists recipes_numbers_sane;
alter table public.recipes add constraint recipes_numbers_sane
  check (
    prep_time between 0 and 10000
    and bake_time between 0 and 10000
    and servings between 0 and 10000
    and (oven_temperature_f is null or oven_temperature_f between 0 and 1000)
    and (rating is null or rating between 0 and 5)
  ) not valid;

alter table public.profiles drop constraint if exists profiles_text_len;
alter table public.profiles add constraint profiles_text_len
  check (
    coalesce(char_length(display_name), 0) <= 100
    and coalesce(octet_length(avatar_url), 0) <= 1000000
    and coalesce(char_length(baking_experience), 0) <= 50
    and coalesce(char_length(favorite_category), 0) <= 50
  ) not valid;

-- 3. Pin the trigger function's search_path (Supabase linter: function_search_path_mutable).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep signup working with the length limits above (metadata is user-supplied).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 100),
    case
      when new.raw_user_meta_data->>'avatar_url' like 'https://%'
      then left(new.raw_user_meta_data->>'avatar_url', 2000)
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. Public buckets already serve files by URL without any SELECT policy.
--    This policy only additionally allowed anyone to LIST every object (and thus
--    every user's id-prefixed folder), so remove it.
drop policy if exists "Public can view recipe images" on storage.objects;

-- Owners may still list their own folder.
drop policy if exists "Users can list own recipe images" on storage.objects;
create policy "Users can list own recipe images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
