import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Backend STT fallback is not configured yet." }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing audio file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (audioFile.size === 0) {
      return new Response(JSON.stringify({ error: "Audio file is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "voice.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "en");
    whisperForm.append("response_format", "json");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperForm,
    });

    const whisperPayload = await whisperResponse.json().catch(() => ({}));

    if (!whisperResponse.ok) {
      const errMessage =
        (typeof whisperPayload?.error?.message === "string" && whisperPayload.error.message) ||
        (typeof whisperPayload?.error === "string" && whisperPayload.error) ||
        "Whisper transcription failed";

      return new Response(JSON.stringify({ error: errMessage }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = typeof whisperPayload?.text === "string" ? whisperPayload.text.trim() : "";

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("roleplay-stt error:", error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
