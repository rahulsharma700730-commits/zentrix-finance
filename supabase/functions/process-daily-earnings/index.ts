import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// MLM rate per level (1-indexed). Level 6+ = 0%.
const MLM_RATES: Record<number, number> = {
  1: 0.10, // direct referrer
  2: 0.03,
  3: 0.03,
  4: 0.02,
  5: 0.02,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: investments, error: invError } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "confirmed")
      .lt("days_paid", 600);

    if (invError) throw invError;
    if (!investments || investments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active investments to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    let processed = 0;
    let skipped = 0;
    let mlmPaid = 0;

    for (const inv of investments) {
      // Already paid today?
      const { data: existing } = await supabase
        .from("daily_earnings")
        .select("id")
        .eq("investment_id", inv.id)
        .eq("earned_date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      let dailyReturn = (Number(inv.amount) * 2) / 600;

      // ROI CAP: never let total earned on this investment exceed amount * 2 (200%).
      const { data: priorEarn } = await supabase
        .from("daily_earnings")
        .select("amount")
        .eq("investment_id", inv.id);
      const earnedSoFar = (priorEarn || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const cap = Number(inv.amount) * 2;
      const remaining = cap - earnedSoFar;
      if (remaining <= 0) {
        // Already capped — mark complete, skip payout.
        await supabase.from("investments")
          .update({ status: "completed", days_paid: 600 })
          .eq("id", inv.id);
        skipped++;
        continue;
      }
      // Rollover: if today's payout would exceed cap, pay only the remainder.
      if (dailyReturn > remaining) dailyReturn = remaining;

      // Insert daily earning
      const { data: earning, error: earnError } = await supabase
        .from("daily_earnings")
        .insert({
          user_id: inv.user_id,
          investment_id: inv.id,
          amount: dailyReturn,
          earned_date: today,
        })
        .select()
        .single();

      if (earnError || !earning) {
        console.error(`Error processing investment ${inv.id}:`, earnError);
        continue;
      }

      // Update days_paid and complete if cap reached
      const newDaysPaid = (inv.days_paid || 0) + 1;
      const newEarned = earnedSoFar + dailyReturn;
      const reachedCap = newEarned >= cap - 0.0001;
      await supabase
        .from("investments")
        .update({
          days_paid: newDaysPaid,
          status: reachedCap || newDaysPaid >= 600 ? "completed" : inv.status,
        })
        .eq("id", inv.id);

      // ===== MLM commission fan-out (5 levels) =====
      const { data: upline, error: uplineErr } = await supabase
        .rpc("get_upline_chain", { _user_id: inv.user_id, _max_levels: 5 });

      if (uplineErr) {
        console.error("Upline error", uplineErr);
      } else if (upline && upline.length > 0) {
        for (const row of upline as Array<{ level: number; ancestor_id: string }>) {
          const rate = MLM_RATES[row.level];
          if (!rate) continue;

          // Ancestor must have at least one confirmed investment.
          const { count: confirmedCount } = await supabase
            .from("investments")
            .select("id", { count: "exact", head: true })
            .eq("user_id", row.ancestor_id)
            .eq("status", "confirmed");
          if (!confirmedCount || confirmedCount === 0) continue;

          // Commission paid on the downline's actual daily ROI payout (per plan).
          // e.g. downline earns $0.333 today → L1 upline gets 10% × $0.333 = $0.0333.
          const commissionAmount = dailyReturn * rate;
          if (commissionAmount <= 0) continue;

          const { error: cErr } = await supabase
            .from("mlm_commissions")
            .insert({
              referrer_id: row.ancestor_id,
              downline_id: inv.user_id,
              daily_earning_id: earning.id,
              level: row.level,
              percentage: rate * 100,
              amount: commissionAmount,
              earned_date: today,
            });
          if (cErr) {
            console.error("mlm_commissions insert", cErr);
            continue;
          }

          await supabase.from("transactions").insert({
            user_id: row.ancestor_id,
            type: "mlm_commission",
            amount: commissionAmount,
            reference_id: earning.id,
            description: `Level ${row.level} MLM commission (${(rate * 100).toFixed(0)}%) from downline`,
          });

          mlmPaid++;
        }
      }

      processed++;
    }

    return new Response(
      JSON.stringify({
        message: "Daily earnings processed",
        processed,
        skipped,
        mlmCommissionsPaid: mlmPaid,
        total: investments.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
