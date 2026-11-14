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
    const model = body.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const baseUrl = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
    const url = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: body.systemInstruction,
        contents: body.contents || [],
        generationConfig: body.generationConfig || { temperature: 0.7 }
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || `HTTP ${upstream.status}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
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
