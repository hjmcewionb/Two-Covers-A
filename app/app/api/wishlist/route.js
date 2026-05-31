import { NextResponse } from "next/server";
import { supabasePublic, supabaseAdmin } from "../../../lib/data";

export async function GET() {
  const { data, error } = await supabasePublic
    .from("wishlist")
    .select("*")
    .order("created_at", { ascending: false });

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
    city: rest.city || "",
    cuisine: rest.cuisine || "",
    notes: rest.notes || "",
    suggested_by: rest.suggested_by || null,
  };

  const { data, error } = await supabaseAdmin()
    .from("wishlist")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
