import json
import os
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from config import DB_PATH, HOST, PORT
from database import init_db
from routes_get import fetch_all_data
from routes_post import handle_post
from routes_update_delete import handle_delete, handle_put

STATIC_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))


class GMRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

    def send_json(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/index.html"
            return super().do_GET()

        if parsed.path == "/api/data":
            self.send_json(fetch_all_data())
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        data, status = handle_post(parsed.path, self.read_json())
        self.send_json(data, status)

    def do_PUT(self):
        parsed = urlparse(self.path)
        data, status = handle_put(parsed.path, self.read_json())
        self.send_json(data, status)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        data, status = handle_delete(parsed.path)
        self.send_json(data, status)


def find_available_port(host, start_port):
    for p in range(start_port, start_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, p)) != 0:
                return p
    return start_port


if __name__ == "__main__":
    init_db()
    active_port = find_available_port(HOST, PORT)
    server = ThreadingHTTPServer((HOST, active_port), GMRequestHandler)
    url = f"http://{HOST}:{active_port}"
    print("=" * 56)
    print("  ESCUDO DO MESTRE — ORDEM PARANORMAL II")
    print("=" * 56)
    print(f"  Servidor ativo em: {url}")
    print(f"  Banco de dados:    {DB_PATH}")
    print("  Mantenha esta janela aberta enquanto usar o sistema.")
    print("  Feche esta janela para encerrar o programa.")
    print("=" * 56)

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
