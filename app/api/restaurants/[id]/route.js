import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/data";

export async function PUT(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const { password, ...rest } = body;

  if (password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const update = {
    name: rest.name,
    city: rest.city,
    cuisine: rest.cuisine,
    visit_date: rest.visit_date || null,
    notes: rest.notes || "",
    scores: rest.scores || {},
    chosen_by: rest.chosen_by || null,
    lat: typeof rest.lat === "number" ? rest.lat : null,
    lng: typeof rest.lng === "number" ? rest.lng : null,
  };

  const { data, error } = await supabaseAdmin()
    .from("restaurants")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const { error } = await supabaseAdmin()
    .from("restaurants")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
