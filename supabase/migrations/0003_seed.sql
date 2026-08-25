-- ============================================================
-- Seed the global service catalog. Safe to re-run.
-- ============================================================
insert into public.service_categories (slug, name, description, icon, base_price_hint) values
  ('grooming',   'Grooming',   'Professional spa, bath & styling for your pet', 'scissors', 499),
  ('training',   'Training',   'Behavioral & obedience programs',                'graduation-cap', 799),
  ('walking',    'Walking',    'Daily walks & exercise',                          'footprints', 299),
  ('veterinary', 'Veterinary', 'Routine checkups & emergency care',               'stethoscope', 599),
  ('store',      'Pet Store',  'Food, toys & accessories delivered',              'shopping-bag', 199)
on conflict (slug) do nothing;

-- To make yourself an admin after signing up, run (replace the email):
--   update public.profiles set role='admin'
--   where id = (select id from auth.users where email='you@example.com');
