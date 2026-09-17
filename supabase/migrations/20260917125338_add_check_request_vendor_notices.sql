-- A check request may optionally send a private in-app notice to the vendor
-- who currently occupies its stall. These fields stay out of staff request
-- lists; GET /api/notices is the only vendor-facing read path.
alter table public.check_requests
  add column if not exists vendor_notified_vendor_id uuid,
  add column if not exists vendor_notified_at timestamptz,
  add column if not exists vendor_notice_message text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'check_requests_notice_recipient_requires_notification'
      and conrelid = 'public.check_requests'::regclass
  ) then
    alter table public.check_requests
      add constraint check_requests_notice_recipient_requires_notification
      check (
        (vendor_notified_at is null and vendor_notified_vendor_id is null)
        or (vendor_notified_at is not null and vendor_notified_vendor_id is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'check_requests_notice_message_requires_notification'
      and conrelid = 'public.check_requests'::regclass
  ) then
    alter table public.check_requests
      add constraint check_requests_notice_message_requires_notification
      check (vendor_notice_message is null or vendor_notified_at is not null);
  end if;
end
$$;

create index if not exists idx_check_requests_vendor_notices
  on public.check_requests (vendor_notified_vendor_id, vendor_notified_at desc)
  where vendor_notified_at is not null;
