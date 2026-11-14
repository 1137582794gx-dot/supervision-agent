#!/usr/bin/env python3
"""
零依赖本地/局域网代理服务器（Python 3 标准库）
用法：
  GEMINI_API_KEY=你的密钥 python3 server.py
或者在同目录创建 .env 文件写入 GEMINI_API_KEY=你的密钥 后运行 python3 server.py
"""
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env_file()
PORT = int(os.environ.get("PORT", "8000"))
BASE_DIR = Path(__file__).resolve().parent


class SupervisionHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/chat":
            api_key = os.environ.get("GEMINI_API_KEY", "").strip()
            self._send_json(200, {"configured": bool(api_key)})
            return
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/chat":
            self._send_json(404, {"error": "Not found"})
            return

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            self._send_json(500, {"error": "服务端未配置 GEMINI_API_KEY"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            req_body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "无效的 JSON 请求体"})
            return

        model = req_body.get("model") or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        base_url = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com").rstrip("/")
        target_url = f"{base_url}/v1beta/models/{urllib.parse.quote(model)}:generateContent?key={urllib.parse.quote(api_key)}"

        gemini_payload = {
            "systemInstruction": req_body.get("systemInstruction"),
            "contents": req_body.get("contents", []),
            "generationConfig": req_body.get("generationConfig", {"temperature": 0.7}),
        }

        req = urllib.request.Request(
            target_url,
            data=json.dumps(gemini_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_raw = e.read().decode("utf-8", errors="replace")
            try:
                err_msg = json.loads(err_raw).get("error", {}).get("message", err_raw)
            except Exception:
                err_msg = err_raw
            self._send_json(e.code, {"error": err_msg})
            return
        except Exception as e:
            self._send_json(502, {"error": f"上游请求失败: {e}"})
            return

        text = (
            resp_data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        if not text:
            self._send_json(502, {"error": "Gemini 未返回有效内容"})
            return
        self._send_json(200, {"text": text})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SupervisionHandler)
    has_key = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    print(f"督导镜 SuperVision Lab 已启动: http://localhost:{PORT}")
    print(f"Gemini API Key 状态: {'已配置 (在线代理可用)' if has_key else '未配置 (请设置 GEMINI_API_KEY 或使用离线模式)'}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止。")
