-- Records whether an officer deliberately notified the vendor about a
-- violation. A nullable timestamp represents "No" without inventing a
-- separate notification row, while preserving exactly when "Yes" happened.
alter table public.violations
  add column if not exists vendor_notified_at timestamptz,
  add column if not exists vendor_notice_message text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'violations_notice_message_requires_notification'
      and conrelid = 'public.violations'::regclass
  ) then
    alter table public.violations
      add constraint violations_notice_message_requires_notification
      check (vendor_notice_message is null or vendor_notified_at is not null);
  end if;
end
$$;

-- GET /api/notices always filters to one vendor and notified rows only.
create index if not exists idx_violations_vendor_notices
  on public.violations (vendor_id, vendor_notified_at desc)
  where vendor_notified_at is not null;

comment on column public.violations.vendor_notified_at is
  'Set when the reporting officer chose to send a private in-app notice to the vendor.';

comment on column public.violations.vendor_notice_message is
  'Optional vendor-facing message; the internal violation description remains staff-only.';
