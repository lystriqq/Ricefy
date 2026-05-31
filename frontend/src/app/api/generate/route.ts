import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rice_id: string = body.rice_id;

  if (!rice_id) {
    return NextResponse.json({ error: "rice_id required" }, { status: 400 });
  }

  const { data: rice } = await supabase
    .from("rices")
    .select("id, status, config_json")
    .eq("id", rice_id)
    .eq("user_id", user.id)
    .single();

  if (!rice) {
    return NextResponse.json({ error: "Rice not found" }, { status: 404 });
  }

  const fastApiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  const res = await fetch(`${fastApiUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rice_id,
      user_id: user.id,
      config: rice.config_json,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { detail?: string }).detail ?? "Generation failed" },
      { status: res.status },
    );
  }

  const result = await res.json();
  return NextResponse.json({ download_url: result.download_url });
}
