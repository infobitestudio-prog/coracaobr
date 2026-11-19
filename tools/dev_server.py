#!/usr/bin/env python3
"""Servidor local de teste: embrulha index.html no mesmo esqueleto que o Artifact usa ao publicar.
Uso: python3 tools/dev_server.py [porta]  ->  http://localhost:8000"""
import http.server, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
HEAD = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html"):
            body = (HEAD + (ROOT / "index.html").read_text() + "</body></html>").encode()
            self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
        else: super().do_GET()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8000), H).serve_forever()
