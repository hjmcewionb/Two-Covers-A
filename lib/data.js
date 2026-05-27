import { createClient } from "@supabase/supabase-js";

// ---- Supabase clients --------------------------------------------------
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// ---- Scoring config ----------------------------------------------------
export const CATEGORIES = [
  { key: "vibes", label: "Vibes" },
  { key: "food", label: "Food" },
  { key: "menu", label: "Menu" },
  { key: "drinks", label: "Drinks" },
  { key: "service", label: "Service" },
  { key: "bathroom", label: "Bathroom" },
];

export function totalOf(scores) {
  const vals = CATEGORIES
    .map((c) => scores?.[c.key])
    .filter((v) => typeof v === "number");
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export const fmt = (n) =>
  typeof n === "number" && n > 0 ? n.toFixed(1) : "\u2014";

export const fmtScore = (v) =>
  typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : "n/a";

export function prettyDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return d;
  }
}

// ---- Geocoding ---------------------------------------------------------
// Turns a free-text place ("Carbone, London") into { lat, lng } using
// OpenStreetMap's free Nominatim service. No API key required.
export async function geocode(query) {
  if (!query || !query.trim()) return null;
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query.trim());
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length) {
      return {
        lat: parseFloat(arr[0].lat),
        lng: parseFloat(arr[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}
