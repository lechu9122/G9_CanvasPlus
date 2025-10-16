/// <reference lib="deno.ns" />

const MODEL = "gpt-5-nano";
const MAX_TOKENS = 1000;

/**
 * Main handler, testable in Node by passing `env`.
 */
export async function handleRequest(req: Request, env: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Replace with frontend URL in prod
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const token = authHeader.split(" ")[1];

    // --- SUPABASE JWT VERIFICATION (skip in tests if env.TEST_MODE) ---
    const SUPABASE_URL = env?.SUPABASE_URL || (typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_URL") : undefined);
    const SUPABASE_SERVICE_ROLE_KEY = env?.SUPABASE_SERVICE_ROLE_KEY || (typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") : undefined);

    if (!env?.TEST_MODE) { // skip in tests
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response("Supabase environment not set", { status: 500, headers: corsHeaders });
      }

      const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      if (!verifyRes.ok) {
        return new Response("Unauthorized: invalid token", { status: 401, headers: corsHeaders });
      }

      const user = await verifyRes.json();
      console.log("Authenticated user:", user);
    }

    // --- REQUEST BODY ---
    const { prompt, history } = await req.json();
    if (!prompt || prompt.trim() === "") {
      return new Response("Missing prompt", { status: 400, headers: corsHeaders });
    }

    // --- OPENAI ---
    const OPENAI_API_KEY = env?.OPENAI_API_KEY || (typeof Deno !== "undefined" ? Deno.env.get("OPENAI_API_KEY") : undefined);
    if (!OPENAI_API_KEY) {
      return new Response("OpenAI API key not set", { status: 500, headers: corsHeaders });
    }

    const messages = [
      { role: "system", content: "You are a helpful assistant responding concisely to student questions." },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: "user", content: prompt },
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages, max_completion_tokens: MAX_TOKENS }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return new Response(`OpenAI API error: ${errText}`, { status: 500, headers: corsHeaders });
    }

    const data = await openaiResponse.json();
    const assistantText = data.choices?.[0]?.message?.content || "No response";

    return new Response(JSON.stringify({ result: assistantText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err);
    return new Response(`Error: ${errorMessage}`, { status: 500, headers: corsHeaders });
  }
}

// --- Only call Deno.serve if running in Deno ---
if (typeof Deno !== "undefined") {
  Deno.serve((req) => handleRequest(req, {}));
}
