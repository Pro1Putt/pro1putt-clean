export async function POST(req: Request) {
  const { tournamentId, round } = await req.json();
  const supabase = getSupabase();

  const { data: regs, error: regsError } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, hcp, gender, birthdate, holes, player_pin")
    .eq("tournament_id", tournamentId);

  if (regsError) return NextResponse.json({ ok: false, error: regsError.message });
  if (!regs || regs.length === 0) return NextResponse.json({ ok: false, error: "Keine Registrierungen" });

  // Bestehende Flights löschen
  await supabase.from("flights").delete().eq("tournament_id", tournamentId).eq("round", round);

  const registrations = regs.map((r: any) => ({
    ...r,
    gender: normalizeGender(r.gender || ""),
    hcp: r.hcp || 999,
  }));

  // Alle in einen Pool, nach HCP sortiert
  registrations.sort((a: any, b: any) => (a.hcp || 999) - (b.hcp || 999));

  // Gruppen zu je 3 bilden
  const groups = [];
  for (let i = 0; i < registrations.length; i += 3) {
    const group = registrations.slice(i, i + 3);
    if (group.length === 1 && groups.length > 0) {
      groups[groups.length - 1].push(group[0]);
    } else {
      groups.push(group);
    }
  }

  let flightsCreated = 0;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const h = group[0]?.holes || 18;
    const g = group[0]?.gender || "Boys";
    const startTime = calcStartTime(i);

    const { data: newFlight, error: insertError } = await supabase
      .from("flights")
      .insert({
        tournament_id: tournamentId,
        flight_number: i + 1,
        round: round,
        round_number: round,
        gender: g,
        status: "active",
        holes: h,
        start_time: startTime,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ ok: false, error: insertError.message });
    if (!newFlight) return NextResponse.json({ ok: false, error: "Flight konnte nicht erstellt werden" });

    for (const player of group) {
      await supabase.from("registrations").update({ flight_id: newFlight.id }).eq("id", player.id);
    }

    for (let j = 0; j < group.length; j++) {
      const player = group[j];
      const countsFor = group[(j + 1) % group.length];
      await supabase.from("flight_players").upsert({
        flight_id: newFlight.id,
        registration_id: player.id,
        marks_registration_id: countsFor.id,
        seat: j + 1,
      }, { onConflict: "flight_id,seat" });
    }

    for (const player of group) {
      await supabase.from("flight_pins").upsert({
        tournament_id: tournamentId,
        flight_id: newFlight.id,
        role: "player",
        player_name: `${player.first_name} ${player.last_name}`,
        pin: player.player_pin,
      }, { onConflict: "pin,flight_id" });
    }

    flightsCreated++;
  }

  return NextResponse.json({ ok: true, flights_created: flightsCreated });
}