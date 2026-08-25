-- ============================================================
-- Location-aware service search.
-- Returns approved vendors offering a category, with Haversine
-- distance from the caller's point, filtered by rating, ordered
-- nearest-first (or by rating). Runs the math in Postgres so we
-- never ship every row to the browser.
--
-- Run AFTER 0001-0003.
-- ============================================================

create or replace function public.nearby_services(
  p_category_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_min_rating numeric default 0,
  p_max_km double precision default 50,
  p_sort text default 'distance',   -- 'distance' | 'rating' | 'price'
  p_limit int default 60
)
returns table (
  service_id uuid,
  title text,
  price numeric,
  duration_minutes int,
  vendor_id uuid,
  business_name text,
  city text,
  latitude double precision,
  longitude double precision,
  rating_avg numeric,
  rating_count int,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    vs.id                as service_id,
    vs.title,
    vs.price,
    vs.duration_minutes,
    v.id                 as vendor_id,
    v.business_name,
    v.city,
    v.latitude,
    v.longitude,
    v.rating_avg,
    v.rating_count,
    -- Haversine distance in km (6371 = Earth radius km)
    case
      when v.latitude is null or v.longitude is null then null
      else 6371 * 2 * asin(sqrt(
        power(sin(radians(v.latitude - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.latitude)) *
        power(sin(radians(v.longitude - p_lng) / 2), 2)
      ))
    end as distance_km
  from public.vendor_services vs
  join public.vendors v on v.id = vs.vendor_id
  where vs.active = true
    and vs.category_id = p_category_id
    and v.status = 'approved'
    and v.rating_avg >= coalesce(p_min_rating, 0)
    -- keep only vendors within range (unlocated vendors are excluded when
    -- a point is supplied and a max radius is set)
    and (
      v.latitude is not null and v.longitude is not null and
      6371 * 2 * asin(sqrt(
        power(sin(radians(v.latitude - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.latitude)) *
        power(sin(radians(v.longitude - p_lng) / 2), 2)
      )) <= p_max_km
    )
  order by
    case when p_sort = 'rating' then v.rating_avg end desc nulls last,
    case when p_sort = 'price'  then vs.price end asc nulls last,
    -- default / tiebreaker: nearest first
    case
      when v.latitude is null or v.longitude is null then null
      else 6371 * 2 * asin(sqrt(
        power(sin(radians(v.latitude - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.latitude)) *
        power(sin(radians(v.longitude - p_lng) / 2), 2)
      ))
    end asc nulls last
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;

-- Allow the browser (anon / authenticated) to call it.
grant execute on function public.nearby_services(
  uuid, double precision, double precision, numeric, double precision, text, int
) to anon, authenticated;
