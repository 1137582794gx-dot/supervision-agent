const DEPRECATED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
]);
const RETRYABLE_STATUS = new Set([404, 429, 500, 502, 503, 504]);

function buildGenerationConfig(baseConfig, model) {
  const cfg = { ...(baseConfig || { temperature: 0.7 }) };
  if (!cfg.thinkingConfig) {
    if (model.includes("gemini-3.1-flash-lite")) {
      cfg.thinkingConfig = { thinkingLevel: "minimal", includeThoughts: false };
    } else if (model.includes("gemini-3.8-flash")) {
      cfg.thinkingConfig = { thinkingLevel: "LOW", includeThoughts: false };
    }
  }
  return cfg;
}

async function callGemini(baseUrl, apiKey, model, payload, timeoutMs) {
  const url = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      systemInstruction: payload.systemInstruction,
      contents: payload.contents || [],
      generationConfig: buildGenerationConfig(payload.generationConfig, model)
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  const rawText = await upstream.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (_) {
    data = { error: { message: rawText || `上游返回非 JSON 响应 (HTTP ${upstream.status})` } };
  }
  return { ok: upstream.ok, status: upstream.status, data };
}

export default async (req) => {
  const apiKey = (Netlify.env.get("GEMINI_API_KEY") || "").trim();

  if (req.method === "GET") {
    return new Response(JSON.stringify({ configured: Boolean(apiKey), runtime: "edge" }), {
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

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Netlify 环境变量尚未配置 GEMINI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const requestedModel = DEPRECATED_MODELS.has(body.model) ? "" : body.model;
    const primaryModel = Netlify.env.get("GEMINI_MODEL") || requestedModel || "gemini-3.1-flash-lite";
    const candidates = [...new Set([primaryModel, "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"])];
    const baseUrl = (Netlify.env.get("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");

    const deadline = Date.now() + 36000;
    let lastError = { status: 503, message: "所有备选 Gemini 模型暂时高负载，请稍后再试" };

    for (let i = 0; i < candidates.length; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 2000) break;
      const attemptTimeout = i < candidates.length - 1 ? Math.min(14000, remaining) : remaining;
      const model = candidates[i];
      try {
        const res = await callGemini(baseUrl, apiKey, model, body, attemptTimeout);
        if (res.ok) {
          const parts = res.data?.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find((p) => !p.thought && typeof p.text === "string") || parts[0];
          const text = textPart?.text || "";
          return new Response(JSON.stringify({ text, model }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        lastError = { status: res.status, message: res.data?.error?.message || `HTTP ${res.status}` };
        if (!RETRYABLE_STATUS.has(res.status)) break;
      } catch (err) {
        const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
        lastError = {
          status: isTimeout ? 504 : 502,
          message: isTimeout ? `模型 ${model} 响应超时` : (err.message || "网络异常")
        };
      }
    }

    return new Response(JSON.stringify({ error: lastError.message }), {
      status: lastError.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/chat"
};
