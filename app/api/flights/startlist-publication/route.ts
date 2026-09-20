import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Veröffentlichungsstatus eines Turniers laden
export async function GET(request: NextRequest) {
  try {
    const tournamentId = request.nextUrl.searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json(
        { error: "tournamentId fehlt." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("startlist_publications")
      .select("round, published")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true });

    if (error) {
      console.error("Startlist publication load failed:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      publications: data ?? [],
    });
  } catch (error) {
    console.error("Startlist publication GET error:", error);

    return NextResponse.json(
      { error: "Veröffentlichungsstatus konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

// Runde veröffentlichen oder wieder ausblenden
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tournamentId = body.tournamentId;
    const round = Number(body.round);
    const published = body.published;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "tournamentId fehlt." },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(round)) {
      return NextResponse.json(
        { error: "Ungültige Runde." },
        { status: 400 }
      );
    }

    if (typeof published !== "boolean") {
      return NextResponse.json(
        { error: "published muss true oder false sein." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("startlist_publications")
      .update({ published })
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .select()
      .single();

    if (error) {
      console.error("Startlist publication update failed:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      publication: data,
    });
  } catch (error) {
    console.error("Startlist publication API error:", error);

    return NextResponse.json(
      { error: "Startlisten-Status konnte nicht geändert werden." },
      { status: 500 }
    );
  }
}