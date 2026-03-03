import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check caller has admin or super_admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const roles = (callerRoles || []).map((r: any) => r.role);
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = roles.includes("admin");

    if (!isSuperAdmin && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target_user_id, action } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: "target_user_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check target user's role
    const { data: targetRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id);

    const targetRoleList = (targetRoles || []).map((r: any) => r.role);
    const targetIsSuperAdmin = targetRoleList.includes("super_admin");
    const targetIsAdmin = targetRoleList.includes("admin");

    // NEVER allow actions against super_admin
    if (targetIsSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Cannot perform actions on super admin" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Admin can only act on photographers, not other admins
    if (isAdmin && !isSuperAdmin && targetIsAdmin) {
      return new Response(
        JSON.stringify({ error: "Admins cannot act on other admins" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: any = { success: true };

    switch (action) {
      case "force_logout": {
        const { error } = await adminClient.auth.admin.signOut(target_user_id);
        if (error) throw error;

        // Log the action
        await adminClient.from("admin_activity_log").insert({
          action: "Force logout",
          performed_by: callerId,
          target: target_user_id,
        });
        break;
      }

      case "promote_to_admin": {
        if (!isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: "Only super admin can promote" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        await adminClient
          .from("user_roles")
          .insert({ user_id: target_user_id, role: "admin" });

        await adminClient.from("admin_activity_log").insert({
          action: "Promoted to admin",
          performed_by: callerId,
          target: target_user_id,
        });
        break;
      }

      case "demote_to_photographer": {
        if (!isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: "Only super admin can demote" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", target_user_id)
          .eq("role", "admin");

        await adminClient.from("admin_activity_log").insert({
          action: "Demoted to photographer",
          performed_by: callerId,
          target: target_user_id,
        });
        break;
      }

      case "delete_user": {
        // Super admin can delete anyone (except super_admin)
        // Admin can only delete photographers
        if (!isSuperAdmin && targetIsAdmin) {
          return new Response(
            JSON.stringify({ error: "Cannot delete admin users" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await adminClient.auth.admin.deleteUser(
          target_user_id
        );
        if (error) throw error;

        await adminClient.from("admin_activity_log").insert({
          action: "Deleted user",
          performed_by: callerId,
          target: target_user_id,
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
