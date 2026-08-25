"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  service_id: string;
  title: string;
  price: number;
  duration_minutes: number | null;
  vendor_id: string;
  business_name: string;
  city: string;
  rating_avg: number;
  rating_count: number;
  distance_km: number | null;
};

type Sort = "distance" | "rating" | "price";
type GeoState = "idle" | "locating" | "granted" | "denied" | "unsupported";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export function NearbyListings({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [geo, setGeo] = useState<GeoState>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [minRating, setMinRating] = useState(0);
  const [maxKm, setMaxKm] = useState(25);
  const [sort, setSort] = useState<Sort>("distance");

  // fallback (no location) — city search
  const [city, setCity] = useState("");

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeo("unsupported");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("granted");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Ask for location on mount.
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Distance-based search via the Postgres RPC.
  const loadNearby = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("nearby_services", {
      p_category_id: categoryId,
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_min_rating: minRating,
      p_max_km: maxKm,
      p_sort: sort,
      p_limit: 60,
    });
    if (error) setError(error.message);
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  }, [coords, categoryId, minRating, maxKm, sort]);

  // City-based fallback (no coordinates) — plain filtered query.
  const loadByCity = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    let q = supabase
      .from("vendor_services")
      .select(
        "id, title, price, duration_minutes, vendor:vendors!inner(id, business_name, city, rating_avg, rating_count, status)"
      )
      .eq("category_id", categoryId)
      .eq("active", true)
      .eq("vendor.status", "approved")
      .gte("vendor.rating_avg", minRating)
      .limit(60);
    if (city) q = q.ilike("vendor.city", `%${city}%`);
    q =
      sort === "price"
        ? q.order("price", { ascending: true })
        : q.order("rating_avg", { ascending: false, referencedTable: "vendors" });

    const { data, error } = await q;
    if (error) setError(error.message);
    const mapped: Listing[] = (data ?? []).map((l: any) => ({
      service_id: l.id,
      title: l.title,
      price: l.price,
      duration_minutes: l.duration_minutes,
      vendor_id: l.vendor.id,
      business_name: l.vendor.business_name,
      city: l.vendor.city,
      rating_avg: l.vendor.rating_avg,
      rating_count: l.vendor.rating_count,
      distance_km: null,
    }));
    setListings(mapped);
    setLoading(false);
  }, [categoryId, minRating, sort, city]);

  // Re-run whichever mode is active when inputs change.
  useEffect(() => {
    if (geo === "granted" && coords) loadNearby();
    else if (geo === "denied" || geo === "unsupported") loadByCity();
  }, [geo, coords, loadNearby, loadByCity]);

  const locationActive = geo === "granted" && !!coords;

  return (
    <>
      {/* Location + filter bar */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* location status */}
          <div className="flex items-center gap-2 text-sm">
            {geo === "locating" && <span className="text-gray-500">📍 Locating you…</span>}
            {locationActive && (
              <span className="font-medium text-green-700">
                📍 Using your live location
              </span>
            )}
            {(geo === "denied" || geo === "unsupported") && (
              <button onClick={requestLocation} className="font-medium text-brand-600">
                📍 Enable location for nearest-first results
              </button>
            )}
          </div>

          {/* radius (only meaningful with location) */}
          {locationActive && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Within
              <select
                className="rounded-lg border border-gray-300 px-2 py-1"
                value={maxKm}
                onChange={(e) => setMaxKm(Number(e.target.value))}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* min rating */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Min rating
            <select
              className="rounded-lg border border-gray-300 px-2 py-1"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
            >
              <option value={0}>Any</option>
              <option value={3}>⭐ 3+</option>
              <option value={4}>⭐ 4+</option>
              <option value={4.5}>⭐ 4.5+</option>
            </select>
          </label>

          {/* sort */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Sort by
            <select
              className="rounded-lg border border-gray-300 px-2 py-1"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              {locationActive && <option value="distance">Nearest first</option>}
              <option value="rating">Highest rated</option>
              <option value="price">Lowest price</option>
            </select>
          </label>
        </div>

        {/* city fallback input */}
        {!locationActive && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadByCity();
            }}
          >
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city (e.g. Bengaluru)"
              className="input max-w-xs"
            />
            <button className="btn-outline">Search</button>
          </form>
        )}
      </div>

      {/* Results */}
      {loading && <p className="mt-8 text-gray-500">Loading providers…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <div key={l.service_id} className="card flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{l.business_name}</h3>
                <p className="text-sm text-gray-500">
                  📍 {l.city}
                  {l.distance_km != null && (
                    <span className="ml-1 font-medium text-brand-600">
                      · {l.distance_km.toFixed(1)} km away
                    </span>
                  )}
                </p>
              </div>
              <span className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                ⭐ {Number(l.rating_avg).toFixed(1)} ({l.rating_count})
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-700">{l.title}</p>
            {l.duration_minutes && (
              <p className="text-xs text-gray-500">⏱ {l.duration_minutes} min</p>
            )}
            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="text-lg font-bold text-accent-600">₹{l.price}</span>
              <Link href={`/book/${l.service_id}`} className="btn-primary text-sm">
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && listings.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          No {categoryName} providers found
          {locationActive ? ` within ${maxKm} km` : ""}
          {minRating > 0 ? ` rated ${minRating}+` : ""}. Try widening the radius or lowering the
          rating filter.
        </p>
      )}
    </>
  );
}
