import { createClient } from "@supabase/supabase-js";

// ---- Supabase clients --------------------------------------------------
// Public (anon) client — used in the browser. Can only READ, per RLS.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client — used ONLY on the server (API routes). The service key
// bypasses RLS so it can write. It is never sent to the browser.
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

// A score is a number, or null meaning "n/a" (excluded from the total).
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
