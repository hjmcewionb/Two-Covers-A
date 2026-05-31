import { NextResponse } from "next/server";
import { supabasePublic, supabaseAdmin } from "../../../lib/data";

export async function GET() {
  const { data, error } = await supabasePublic
    .from("restaurants")
    .select("*")
    .order("visit_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password, ...rest } = body;

  if (password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const insert = {
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
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
