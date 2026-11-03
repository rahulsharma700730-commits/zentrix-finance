import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");

    if (!roleData || roleData.length === 0) throw new Error("Admin access required");

    const { user_id, confirm_email } = await req.json();
    if (!user_id || typeof user_id !== "string") throw new Error("user_id required");
    if (!confirm_email || typeof confirm_email !== "string") throw new Error("Confirmation email required");

    // Load the target user
    const { data: target, error: targetError } = await supabase.auth.admin.getUserById(user_id);
    if (targetError || !target?.user) throw new Error("User not found");

    // Guard 1: the typed email must exactly match the account being deleted
    if (confirm_email.trim().toLowerCase() !== (target.user.email || "").toLowerCase()) {
      throw new Error("Confirmation email does not match this account. Deletion cancelled.");
    }

    // Guard 2: never allow deleting your own admin account from here
    if (user_id === caller.id) throw new Error("You cannot delete your own admin account");

    // Guard 3: never delete another admin
    const { data: targetRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .eq("role", "admin");
    if (targetRoles && targetRoles.length > 0) throw new Error("Admin accounts cannot be deleted from here");

    // Resolve the user's upline BEFORE removal so their team stats can be recomputed after
    const { data: upline } = await supabase.rpc("get_upline_chain", { _user_id: user_id, _max_levels: 5 });
    const ancestors: string[] = (upline || []).map((r: any) => r.ancestor_id);

    // Detach team members so the auth-user delete is not blocked by the profiles FK
    await supabase.from("profiles").update({ referred_by: null }).eq("referred_by", user_id);
    // Clear admin references that also block deletion
    await supabase.from("investments").update({ confirmed_by: null }).eq("confirmed_by", user_id);
    await supabase.from("withdrawals").update({ processed_by: null }).eq("processed_by", user_id);

    // Clean up rows that have no FK to auth.users (would dangle otherwise)
    await supabase.from("mlm_commissions").delete().eq("referrer_id", user_id);
    await supabase.from("mlm_commissions").delete().eq("downline_id", user_id);
    await supabase.from("notifications").delete().eq("user_id", user_id);
    await supabase.from("support_tickets").delete().eq("user_id", user_id);

    // Delete the auth user — profiles, investments, earnings, withdrawals,
    // transactions, roles, commissions and audit history cascade from it.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    // Recompute team stats for the surviving upline
    for (const ancestor of ancestors) {
      if (ancestor && ancestor !== user_id) {
        await supabase.rpc("recompute_team_stats", { _user_id: ancestor });
      }
    }

    return new Response(JSON.stringify({ success: true, message: "User permanently deleted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
