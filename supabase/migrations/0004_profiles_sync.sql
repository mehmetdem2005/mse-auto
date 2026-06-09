-- 0004: profiles'ı auth.users ile senkronla.
-- 0001'de profiles tablosu var ama dolduran trigger yoktu → tablo boş kalıyordu.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, coalesce(new.created_at, now()))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_new_user();

-- Mevcut kullanıcıları geriye dönük doldur.
insert into public.profiles (id, email, created_at)
select id, email, created_at from auth.users
on conflict (id) do update set email = excluded.email;
