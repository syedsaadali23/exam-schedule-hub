
-- Semesters table
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  semester_type text not null,
  year integer not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(semester_type, year)
);

-- Exam sheets table
create table public.exam_sheets (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references public.semesters(id) on delete cascade not null,
  exam_type text not null,
  current_version text not null,
  uploaded_at timestamptz not null default now(),
  courses jsonb not null default '[]',
  unique(semester_id, exam_type)
);

-- Exam sheet versions (history)
create table public.exam_sheet_versions (
  id uuid primary key default gen_random_uuid(),
  exam_sheet_id uuid references public.exam_sheets(id) on delete cascade not null,
  semester_id uuid not null,
  exam_type text not null,
  current_version text not null,
  uploaded_at timestamptz not null,
  courses jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Admin settings (password storage)
create table public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  password text not null default 'examdesk2025'
);

-- Insert default admin settings
insert into public.admin_settings (password) values ('examdesk2025');

-- Enable RLS on all tables
alter table public.semesters enable row level security;
alter table public.exam_sheets enable row level security;
alter table public.exam_sheet_versions enable row level security;
alter table public.admin_settings enable row level security;

-- Semesters: publicly readable, publicly writable (admin auth is app-level)
create policy "Anyone can read semesters" on public.semesters for select to anon using (true);
create policy "Anyone can insert semesters" on public.semesters for insert to anon with check (true);
create policy "Anyone can update semesters" on public.semesters for update to anon using (true) with check (true);
create policy "Anyone can delete semesters" on public.semesters for delete to anon using (true);

-- Exam sheets: publicly readable and writable
create policy "Anyone can read exam_sheets" on public.exam_sheets for select to anon using (true);
create policy "Anyone can insert exam_sheets" on public.exam_sheets for insert to anon with check (true);
create policy "Anyone can update exam_sheets" on public.exam_sheets for update to anon using (true) with check (true);
create policy "Anyone can delete exam_sheets" on public.exam_sheets for delete to anon using (true);

-- Exam sheet versions: publicly readable and writable
create policy "Anyone can read exam_sheet_versions" on public.exam_sheet_versions for select to anon using (true);
create policy "Anyone can insert exam_sheet_versions" on public.exam_sheet_versions for insert to anon with check (true);
create policy "Anyone can delete exam_sheet_versions" on public.exam_sheet_versions for delete to anon using (true);

-- Admin settings: NO direct access (use functions instead)
create policy "No direct read of admin_settings" on public.admin_settings for select to anon using (false);
create policy "No direct write to admin_settings" on public.admin_settings for insert to anon with check (false);
create policy "No direct update of admin_settings" on public.admin_settings for update to anon using (false);
create policy "No direct delete of admin_settings" on public.admin_settings for delete to anon using (false);

-- Security definer function to verify admin password
create or replace function public.verify_admin_password(input_password text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_settings where password = input_password limit 1
  )
$$;

-- Security definer function to update admin password
create or replace function public.update_admin_password(current_pw text, new_pw text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admin_settings where password = current_pw) then
    return false;
  end if;
  if length(new_pw) < 6 then
    return false;
  end if;
  update public.admin_settings set password = new_pw;
  return true;
end;
$$;
