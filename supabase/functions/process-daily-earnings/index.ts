import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all confirmed investments that haven't completed 600 days
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

    for (const inv of investments) {
      // Check if already paid today
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

      const dailyReturn = (Number(inv.amount) * 2) / 600;

      // Insert daily earning
      const { error: earnError } = await supabase
        .from("daily_earnings")
        .insert({
          user_id: inv.user_id,
          investment_id: inv.id,
          amount: dailyReturn,
          earned_date: today,
        });

      if (earnError) {
        console.error(`Error processing investment ${inv.id}:`, earnError);
        continue;
      }

      // Update days_paid
      await supabase
        .from("investments")
        .update({ days_paid: (inv.days_paid || 0) + 1 })
        .eq("id", inv.id);

      // Mark completed if 600 days done
      if ((inv.days_paid || 0) + 1 >= 600) {
        await supabase
          .from("investments")
          .update({ status: "completed" })
          .eq("id", inv.id);
      }

      processed++;
    }

    return new Response(
      JSON.stringify({ message: "Daily earnings processed", processed, skipped, total: investments.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
