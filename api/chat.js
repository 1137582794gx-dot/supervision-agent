export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ configured: Boolean(process.env.GEMINI_API_KEY) });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Vercel 环境变量尚未配置 GEMINI_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const model = body.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const baseUrl = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
    const url = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: body.systemInstruction,
        contents: body.contents || [],
        generationConfig: body.generationConfig || { temperature: 0.7 }
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || `Gemini API HTTP ${upstream.status}`
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      return res.status(502).json({ error: "Gemini 未返回有效内容" });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
