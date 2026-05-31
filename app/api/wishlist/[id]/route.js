import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/data";

// DELETE — remove a wishlist entry
export async function DELETE(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const { error } = await supabaseAdmin()
    .from("wishlist")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST — convert a wishlist item into a recorded visit.
// Creates a new restaurants row using the wishlist data + any new fields,
// then deletes the wishlist entry.
export async function POST(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const { password, ...rest } = body;

  if (password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const admin = supabaseAdmin();

  // Fetch the wishlist entry first
  const { data: wish, error: wishErr } = await admin
    .from("wishlist")
    .select("*")
    .eq("id", params.id)
    .single();

  if (wishErr || !wish) {
    return NextResponse.json({ error: "Wishlist entry not found" }, { status: 404 });
  }

  // Build the restaurant row from wishlist + incoming overrides
  const insert = {
    name: rest.name || wish.name,
    city: rest.city || wish.city,
    cuisine: rest.cuisine || wish.cuisine,
    visit_date: rest.visit_date || null,
    notes: rest.notes || "",
    scores: rest.scores || {},
    chosen_by: rest.chosen_by || wish.suggested_by || null,
    lat: typeof rest.lat === "number" ? rest.lat : null,
    lng: typeof rest.lng === "number" ? rest.lng : null,
  };

  const { data: created, error: createErr } = await admin
    .from("restaurants")
    .insert(insert)
    .select()
    .single();

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

  // Delete the wishlist entry now that it's been recorded
  await admin.from("wishlist").delete().eq("id", params.id);

  return NextResponse.json(created, { status: 201 });
}
