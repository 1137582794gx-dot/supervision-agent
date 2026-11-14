export default async (req) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ configured: Boolean(process.env.GEMINI_API_KEY) }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Netlify 环境变量尚未配置 GEMINI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const deprecatedModels = new Set([
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ]);
    const requestedModel = deprecatedModels.has(body.model) ? "" : body.model;
    const model = process.env.GEMINI_MODEL || requestedModel || "gemini-3.8-flash";
    const baseUrl = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
    const url = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const baseGenConfig = body.generationConfig || { temperature: 0.7 };
    const generationConfig = {
      ...baseGenConfig,
      ...(model.includes("gemini-3.8-flash") && !baseGenConfig.thinkingConfig
        ? { thinkingConfig: { thinkingLevel: "LOW", includeThoughts: false } }
        : {})
    };

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: body.systemInstruction,
        contents: body.contents || [],
        generationConfig
      }),
      signal: AbortSignal.timeout(9200)
    });

    const rawText = await upstream.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (_) {
      data = { error: { message: rawText || `上游返回非 JSON 响应 (HTTP ${upstream.status})` } };
    }

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || `HTTP ${upstream.status}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p) => !p.thought && typeof p.text === "string") || parts[0];
    const text = textPart?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return new Response(
      JSON.stringify({ error: isTimeout ? "Gemini 响应超过 9 秒触发平台超时保护，请再发一次或点重试" : (err.message || "Internal Server Error") }),
      {
        status: isTimeout ? 504 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

export const config = {
  path: "/api/chat"
};
