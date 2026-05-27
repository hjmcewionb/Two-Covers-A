import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/data";

// PUT /api/restaurants/[id]  — update. Requires the shared password.
export async function PUT(request, { params }) {
  const body = await request.json();

  if (body.password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const entry = {
    name: (body.name || "").trim(),
    city: (body.city || "").trim(),
    cuisine: (body.cuisine || "").trim(),
    visit_date: body.visit_date || null,
    notes: (body.notes || "").trim(),
    scores: body.scores || {},
  };

  if (!entry.name || !entry.city) {
    return NextResponse.json(
      { error: "Name and location are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("restaurants")
    .update(entry)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /api/restaurants/[id]  — requires the shared password.
export async function DELETE(request, { params }) {
  const body = await request.json().catch(() => ({}));

  if (body.password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const { error } = await supabaseAdmin()
    .from("restaurants")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
