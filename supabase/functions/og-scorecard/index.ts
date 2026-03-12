import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE_URL = "https://sales-dialogue-lab.lovable.app";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("scorecards")
    .select("score, rank, percentile, scenario_title, display_name, elo, elo_delta, rubric_scores, framework_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    // Redirect to homepage if scorecard not found
    return Response.redirect(`${SITE_URL}/scenarios`, 302);
  }

  const topPercent = Math.max(1, 100 - (data.percentile ?? 50));
  const displayName = escapeHtml(data.display_name || "Anonymous");
  const scenarioTitle = escapeHtml(data.scenario_title || "Sales Scenario");

  // Compute strongest/weakest from rubric
  const rubric = (data.rubric_scores as { criterion: string; score: number }[]) || [];
  let strongLabel = "";
  let weakLabel = "";
  if (rubric.length > 0) {
    const strongest = rubric.reduce((a, b) => (b.score > a.score ? b : a), rubric[0]);
    const weakest = rubric.reduce((a, b) => (b.score < a.score ? b : a), rubric[0]);
    strongLabel = `💪 ${strongest.criterion}: ${strongest.score}/100`;
    weakLabel = `⚠️ ${weakest.criterion}: ${weakest.score}/100`;
  }

  const title = `${displayName} scored ${data.score}/100 — ${scenarioTitle}`;
  const description = [
    `🏆 ${data.rank} · Top ${topPercent}%`,
    data.elo ? `⚡ ${data.elo} ELO${data.elo_delta != null ? ` (${data.elo_delta >= 0 ? "+" : ""}${data.elo_delta})` : ""}` : null,
    strongLabel || null,
    weakLabel || null,
    `Can you beat this score?`,
  ].filter(Boolean).join(" | ");

  const canonicalUrl = `${SITE_URL}/scorecard/${id}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="SalesCalls.io" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />

  <!-- Redirect real users to SPA -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
  <link rel="canonical" href="${canonicalUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">scorecard</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
