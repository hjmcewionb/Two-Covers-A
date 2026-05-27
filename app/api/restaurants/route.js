import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/data";

// GET /api/restaurants  — public, returns all entries
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("restaurants")
    .select("*")
    .order("visit_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/restaurants  — create. Requires the shared password.
export async function POST(request) {
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
    .insert(entry)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
